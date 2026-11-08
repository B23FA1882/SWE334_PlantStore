# GREENROOM ERD (8 tables)

The system includes 1:N, N:M, and auth relationships. Paste the Mermaid graph into Mermaid Live Editor if you need an exported SVG/PDF for the Defense-1 slides.

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : "id (Auth)"
  PROFILES ||--o{ ORDERS : places
  CATEGORIES ||--o{ PRODUCTS : contains
  PRODUCTS ||--o{ ORDER_ITEMS : ordered_as
  ORDERS ||--|{ ORDER_ITEMS : has
  PRODUCTS ||--o{ PRODUCT_TAGS : classified_by
  TAGS ||--o{ PRODUCT_TAGS : labels
  ORDERS ||--o{ PAYMENTS : receives
  PROFILES {
    uuid id PK,FK
    text full_name
    text role
  }
  CATEGORIES {
    uuid id PK
    text name
    text slug UK
  }
  PRODUCTS {
    uuid id PK
    uuid category_id FK
    text slug UK
    text name
    numeric price
    int stock
    text image_url
  }
  TAGS {
    uuid id PK
    text name
  }
  PRODUCT_TAGS {
    uuid product_id PK,FK
    uuid tag_id PK,FK
  }
  ORDERS {
    uuid id PK
    uuid user_id FK
    text status
    numeric total_amount
  }
  ORDER_ITEMS {
    uuid id PK
    uuid order_id FK
    uuid product_id FK
    int quantity
    numeric unit_price
  }
  PAYMENTS {
    uuid id PK
    uuid order_id FK
    text provider
    text external_id UK
    text status
  }
```

**Authorization**: visitor = anonymous read for active products/categories/tags; user = Auth + own profile/orders/payment read, backend RPC creates orders; admin = database-controlled role and RLS policies for CRUD. Never check `user_metadata` for admin roles. The checkout webhook is the sole normal source of a paid payment event.
