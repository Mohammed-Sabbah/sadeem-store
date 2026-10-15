# Product and Category API

Base path: `/api`  
Send JSON request bodies with `Content-Type: application/json`. Routes marked **Seller** or **Admin** require an authenticated account with that role.

Replace `:id`, `:variantId`, and `:slug` with actual values. Example IDs below are placeholders.

## Products

| Method | Path | Access | Request example |
| --- | --- | --- | --- |
| `GET` | `/products` | Public | No body. Optional query: `?categoryId=<categoryId>&storeId=<storeId>` |
| `GET` | `/products/:id` | Public | No body |
| `GET` | `/products/seller` | Seller | No body |
| `GET` | `/products/admin` | Admin | No body |
| `POST` | `/products` | Seller | See create product below |
| `PATCH` | `/products/:id` | Seller | See update product below |
| `PATCH` | `/products/:id/status` | Seller | `{"status":"inActive"}` |
| `DELETE` | `/products/admin/:id` | Admin | No body |
| `PATCH` | `/products/admin/:id/approval` | Admin | `{"approveStatus":"approved"}` |
| `POST` | `/products/:id/variants` | Seller | See add variant below |
| `PATCH` | `/products/:id/variants/:variantId` | Seller | See update variant below |
| `DELETE` | `/products/:id/variants/:variantId` | Seller | No body |
| `PATCH` | `/products/:id/variants/:variantId/status` | Seller | `{"status":"active"}` |
| `PATCH` | `/products/admin/:id/variants/:variantId/approval` | Admin | `{"approveStatus":"approved"}` |

### Create product

`POST /api/products`

```json
{
  "title": "Cotton T-Shirt",
  "description": "Soft cotton T-shirt",
  "categoryId": "64f000000000000000000001",
  "image": "https://example.com/t-shirt.jpg",
  "price": 25.5,
  "stock": 10
}
```

`description` is optional. `image` can be an HTTP(S) URL or a local site path.

Products and variants are stored in separate MongoDB collections. Creating a product still creates its initial variant from `price` and `stock`.

### Update product

`PATCH /api/products/:id` — include one or more editable fields:

```json
{
  "title": "Updated T-Shirt",
  "description": "Updated description",
  "categoryId": "64f000000000000000000001",
  "image": "/images/t-shirt.jpg"
}
```

### Add a variant

`POST /api/products/:id/variants`

```json
{
  "attributes": {
    "Color": "Blue",
    "Size": "M"
  },
  "price": 27,
  "stock": 8
}
```

Variant attributes are optional. Omit `attributes` or send `{}` to create a variant without attributes:

```json
{
  "price": 27,
  "stock": 8
}
```

When provided, all variant attributes must be defined by the product's category. A product cannot have two variants with the same attribute combination; this also means it can have only one variant with no attributes.

### Delete a variant

`DELETE /api/products/:id/variants/:variantId`

This soft-deletes the variant. Deleted variants are omitted from product responses. If this was the product's last active variant, the product status is set to `inActive`. Setting a product's last active variant to `inActive` also sets the product to `inActive`.

### Update a variant

`PATCH /api/products/:id/variants/:variantId` — send one or more fields:

```json
{
  "attributes": {
    "Color": "Black",
    "Size": "L"
  },
  "price": 29,
  "stock": 5
}
```

Product and variant `status` values: `active`, `inActive`.  
Product and variant `approveStatus` values: `pending`, `approved`, `rejected`.

### Migrating existing products

Before deploying the separate variant collection, back up the database and stop product writes. Run the migration from the `backend` directory:

```sh
node scripts/migrate-embedded-variants.js
```

The migration preserves variant IDs and is safe to rerun. It removes each product's embedded `variants` field only after those variants have been copied to the `variants` collection.

## Categories

| Method | Path | Access | Request example |
| --- | --- | --- | --- |
| `GET` | `/categories` | Public | No body |
| `GET` | `/categories/:slug` | Public | No body |
| `POST` | `/categories` | Admin | See create category below |
| `PATCH` | `/categories/:id` | Admin | See update category below |
| `DELETE` | `/categories/:id` | Admin | No body |
| `DELETE` | `/categories/:id/variant-attributes/:attributeName` | Admin | No body |

### Create category

`POST /api/categories`

```json
{
  "title": "Clothing",
  "variantAttributes": [
    {
      "name": "Size",
      "values": ["S", "M", "L"]
    },
    {
      "name": "Color",
      "values": ["Black", "Blue"]
    }
  ]
}
```

`variantAttributes` is optional and defaults to an empty array.

### Update category

`PATCH /api/categories/:id` — send one or more fields:

```json
{
  "title": "Apparel",
  "variantAttributes": [
    {
      "name": "Size",
      "values": ["S", "M", "L", "XL"]
    }
  ],
  "isActive": true
}
```

To remove a variant attribute, use `DELETE /api/categories/:id/variant-attributes/:attributeName` (no request body).
