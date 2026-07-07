export function getUserId(user) {
  if (!user) return null;
  return user.id || user._id || user.userId || null;
}

export function getHostId(hostId) {
  if (!hostId) return null;
  if (typeof hostId === "object" && hostId._id) {
    return hostId._id.toString();
  }
  return hostId.toString();
}
