export function hasTeacherAccess(claims) {
  return claims?.teacher === true;
}
