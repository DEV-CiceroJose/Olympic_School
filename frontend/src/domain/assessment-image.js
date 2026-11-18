export const MAX_ASSESSMENT_IMAGE_LENGTH = 100_000;

export function validAssessmentImage(value) {
  if (!value) return true;
  if (value.startsWith("data:")) {
    return (
      value.length <= MAX_ASSESSMENT_IMAGE_LENGTH &&
      /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
    );
  }
  try {
    return value.length <= 2048 && new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
