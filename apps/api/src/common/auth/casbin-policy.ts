export const casbinModelText = `
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && regexMatch(r.act, p.act)
`;

export const casbinPolicies = [
  ['p', 'ADMIN', '*', '.*'],
  ['p', 'REVIEWER', 'role:REVIEWER', 'use'],
  ['p', 'REVIEWER', 'role:EDITOR', 'use'],
  ['p', 'EDITOR', 'role:EDITOR', 'use'],
  ['p', 'USER', 'role:USER', 'use'],
  ['p', 'ADMIN', 'publication', 'any'],
  ['p', 'USER', 'publication', 'own'],
  ['p', 'ADMIN', 'user-credential', 'any'],
  ['p', 'USER', 'user-credential', 'own'],
  ['g', 'ADMIN', 'ADMIN'],
  ['g', 'ADMIN', 'REVIEWER'],
  ['g', 'ADMIN', 'EDITOR'],
  ['g', 'ADMIN', 'USER'],
  ['g', 'REVIEWER', 'REVIEWER'],
  ['g', 'REVIEWER', 'EDITOR'],
  ['g', 'EDITOR', 'EDITOR'],
  ['g', 'USER', 'USER'],
] as const;
