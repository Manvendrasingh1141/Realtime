// Simple anonymous label generator and local cache
const STORAGE_KEY = 'jugaad_anonymous_user';

export function getAnonymousUser() {
  let user = localStorage.getItem(STORAGE_KEY);
  if (!user) {
    const randomId = Math.floor(100 + Math.random() * 900);
    user = `Guest #${randomId}`;
    localStorage.setItem(STORAGE_KEY, user);
  }
  return user;
}

export function setAnonymousUser(name) {
  if (name && name.trim()) {
    localStorage.setItem(STORAGE_KEY, name.trim().slice(0, 30));
    return name.trim().slice(0, 30);
  }
  return getAnonymousUser();
}
