export const createId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export const sessionId = createId("session");
