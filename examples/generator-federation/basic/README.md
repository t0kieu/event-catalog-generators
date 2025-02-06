# EventCatalog Federation Example

This example shows you how to use EventCatalog federation to connect multiple EventCatalog instances together.

In this example we have three teams `customer-experience-team`, `order-management-team` and `payment-team`. Each team has their own EventCatalog instance and keeps there catalog close to their code.

We also have a central EventCatalog instance that is used to view all the teams catalogs and merge them together using federation.

### Why Federation?

Federation can help large organizations and teams to:

- Keep their catalog close to their code (no need to swap context)
- Keep their catalog up to date with their code
- Merge many catalogs into a single catalog for an organization
- Create a single source of truth for an organization
- Ease the burden of keeping multiple catalogs in sync
- Ease the burden of keeping documentation up to date as it's close to the code
- Surface relevant information from across an organization

