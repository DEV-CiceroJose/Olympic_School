function decode(value) {
  if ("nullValue" in value) return null;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("timestampValue" in value) return new Date(value.timestampValue);
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decode);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields);
  return Object.values(value)[0];
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decode(value)]));
}

function encode(value) {
  if (value === null) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: encodeFields(value) } };
}

function encodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encode(value)]));
}

function snapshot(document) {
  return {
    id: document.name.split("/").at(-1),
    updateTime: document.updateTime,
    data: decodeFields(document.fields),
  };
}

export function createFirestore({
  projectId,
  databaseId,
  token,
  origin = "https://firestore.googleapis.com",
}) {
  const prefix = `projects/${projectId}/databases/${databaseId}/documents`;

  async function request(path, { body, query } = {}) {
    const url = new URL(`/v1/${prefix}${path}`, origin);
    if (query) url.search = query.toString();
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body && { "Content-Type": "application/json" }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.status === 404 && !body) return null;
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = new Error(`Firestore request failed (${response.status})`);
      error.code = payload.error?.status;
      throw error;
    }
    return response.json();
  }

  return {
    async get(path, fields = []) {
      const query = new URLSearchParams(fields.map((field) => ["mask.fieldPaths", field]));
      const document = await request(`/${path}`, { query });
      return document ? snapshot(document) : null;
    },
    async getMany(paths, fields) {
      const rows = await request(":batchGet", {
        body: { documents: paths.map((path) => `${prefix}/${path}`), mask: { fieldPaths: fields } },
      });
      return rows.flatMap(({ found }) => (found ? [snapshot(found)] : []));
    },
    async expired(now, limit) {
      const rows = await request(":runQuery", {
        body: {
          structuredQuery: {
            from: [{ collectionId: "assessmentSessions" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: "status" },
                      op: "EQUAL",
                      value: encode("in_progress"),
                    },
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: "deadlineAt" },
                      op: "LESS_THAN_OR_EQUAL",
                      value: encode(now),
                    },
                  },
                ],
              },
            },
            limit,
          },
        },
      });
      return rows.flatMap(({ document }) => (document ? [snapshot(document)] : []));
    },
    async commit(writes) {
      await request(":commit", {
        body: {
          writes: writes.map(({ path, fields, updateTime }) => ({
            update: { name: `${prefix}/${path}`, fields: encodeFields(fields) },
            ...(updateTime && { updateMask: { fieldPaths: Object.keys(fields) } }),
            currentDocument: updateTime ? { updateTime } : { exists: false },
          })),
        },
      });
    },
  };
}
