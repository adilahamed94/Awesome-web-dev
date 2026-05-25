"""
Generate sample packaged products monthly sales data for Power BI dashboard.
Run: python generate_data.py
Outputs: packaged_products_sales.csv, products_master.csv, regions_master.csv
"""

import csv
import random
from datetime import date

random.seed(42)

CATEGORIES = {
    "Snacks":     ["Potato Chips", "Tortilla Chips", "Pretzels", "Popcorn", "Crackers", "Nuts Mix"],
    "Beverages":  ["Cola 500ml", "Orange Juice 1L", "Mineral Water 1.5L", "Energy Drink", "Iced Tea 330ml", "Sports Drink"],
    "Dairy":      ["Full Cream Milk 1L", "Greek Yogurt 200g", "Cheddar Cheese 250g", "Butter 250g", "Cream Cheese 150g"],
    "Bakery":     ["White Bread Loaf", "Whole Wheat Bread", "Croissant 4pk", "Muffins 6pk", "Bagels 4pk"],
    "Confectionery": ["Milk Chocolate Bar", "Dark Chocolate Bar", "Gummy Bears", "Jelly Beans", "Hard Candy Mix"],
    "Frozen":     ["Frozen Pizza", "Ice Cream 1L", "Frozen Fries 1kg", "Fish Fingers 400g", "Frozen Peas 500g"],
    "Canned Goods": ["Canned Tuna 185g", "Canned Beans 400g", "Canned Tomatoes 400g", "Canned Corn 340g"],
    "Condiments": ["Tomato Ketchup 500ml", "Mustard 250g", "Mayonnaise 400g", "BBQ Sauce 350ml", "Hot Sauce 150ml"],
}

REGIONS = ["North", "South", "East", "West", "Central"]
CHANNELS = ["Supermarket", "Convenience Store", "Online", "Wholesale", "Hypermarket"]
CUSTOMER_SEGMENTS = ["Family", "Young Adults", "Seniors", "Students", "Health-Conscious"]

BASE_PRICE = {
    "Snacks": (1.50, 4.50), "Beverages": (0.80, 3.50), "Dairy": (1.20, 5.00),
    "Bakery": (1.00, 4.00), "Confectionery": (0.90, 3.00), "Frozen": (2.50, 8.00),
    "Canned Goods": (0.70, 2.50), "Condiments": (1.50, 4.00),
}

COST_RATIO = {
    "Snacks": 0.42, "Beverages": 0.38, "Dairy": 0.55, "Bakery": 0.50,
    "Confectionery": 0.40, "Frozen": 0.48, "Canned Goods": 0.45, "Condiments": 0.43,
}

MONTHLY_SEASONALITY = {
    1: 0.85, 2: 0.80, 3: 0.90, 4: 0.95, 5: 1.00, 6: 1.10,
    7: 1.15, 8: 1.12, 9: 1.00, 10: 1.05, 11: 1.20, 12: 1.35,
}

CATEGORY_SEASONALITY = {
    "Frozen":     {1: 1.05, 2: 1.00, 3: 0.90, 4: 0.85, 5: 1.00, 6: 1.30, 7: 1.40, 8: 1.35, 9: 0.95, 10: 0.90, 11: 1.00, 12: 1.10},
    "Beverages":  {1: 0.80, 2: 0.78, 3: 0.88, 4: 0.95, 5: 1.05, 6: 1.25, 7: 1.35, 8: 1.30, 9: 1.00, 10: 0.90, 11: 0.85, 12: 1.00},
    "Confectionery": {1: 1.20, 2: 1.40, 3: 0.90, 4: 1.30, 5: 0.85, 6: 0.80, 7: 0.80, 8: 0.85, 9: 0.90, 10: 1.10, 11: 1.20, 12: 1.50},
}

products = []
for cat, items in CATEGORIES.items():
    lo, hi = BASE_PRICE[cat]
    for item in items:
        price = round(random.uniform(lo, hi), 2)
        cost  = round(price * COST_RATIO[cat], 2)
        products.append({"product_name": item, "category": cat, "unit_price": price, "unit_cost": cost})

sales_rows = []
row_id = 1

for year in [2024, 2025]:
    for month in range(1, 13):
        if year == 2025 and month > 5:
            break
        period_label = date(year, month, 1).strftime("%b %Y")
        for region in REGIONS:
            for channel in CHANNELS:
                for product in products:
                    base_units = random.randint(80, 600)
                    season_mult = MONTHLY_SEASONALITY[month]
                    cat_season  = CATEGORY_SEASONALITY.get(product["category"], {}).get(month, 1.0)
                    region_mult = {"North": 1.05, "South": 0.95, "East": 1.10, "West": 1.00, "Central": 0.98}[region]
                    channel_mult = {"Supermarket": 1.20, "Convenience Store": 0.85, "Online": 1.10, "Wholesale": 1.40, "Hypermarket": 1.30}[channel]
                    units = max(1, int(base_units * season_mult * cat_season * region_mult * channel_mult * random.uniform(0.85, 1.15)))

                    segment = random.choice(CUSTOMER_SEGMENTS)
                    revenue = round(units * product["unit_price"], 2)
                    cogs    = round(units * product["unit_cost"], 2)
                    profit  = round(revenue - cogs, 2)
                    margin  = round((profit / revenue) * 100, 2) if revenue else 0
                    returns = random.randint(0, max(1, int(units * 0.03)))
                    net_units = units - returns
                    net_revenue = round(net_units * product["unit_price"], 2)

                    sales_rows.append({
                        "row_id": row_id,
                        "date": date(year, month, 1).strftime("%Y-%m-%d"),
                        "period": period_label,
                        "year": year,
                        "month": month,
                        "month_name": date(year, month, 1).strftime("%B"),
                        "product_name": product["product_name"],
                        "category": product["category"],
                        "region": region,
                        "channel": channel,
                        "customer_segment": segment,
                        "units_sold": units,
                        "returns": returns,
                        "net_units": net_units,
                        "unit_price": product["unit_price"],
                        "unit_cost": product["unit_cost"],
                        "gross_revenue": revenue,
                        "cogs": cogs,
                        "gross_profit": profit,
                        "net_revenue": net_revenue,
                        "gross_margin_pct": margin,
                    })
                    row_id += 1

sales_file = "packaged_products_sales.csv"
fields = list(sales_rows[0].keys())
with open(sales_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(sales_rows)
print(f"Written {len(sales_rows):,} rows to {sales_file}")

products_file = "products_master.csv"
with open(products_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["product_name", "category", "unit_price", "unit_cost"])
    writer.writeheader()
    writer.writerows(products)
print(f"Written {len(products)} products to {products_file}")

regions_file = "regions_master.csv"
region_data = [
    {"region": "North",   "region_manager": "Alice Johnson",  "territory": "Northern States",  "target_multiplier": 1.05},
    {"region": "South",   "region_manager": "Bob Martinez",   "territory": "Southern States",  "target_multiplier": 0.95},
    {"region": "East",    "region_manager": "Carol Wang",     "territory": "Eastern Corridor",  "target_multiplier": 1.10},
    {"region": "West",    "region_manager": "David Kim",      "territory": "Western Region",   "target_multiplier": 1.00},
    {"region": "Central", "region_manager": "Emma Brown",     "territory": "Central Belt",     "target_multiplier": 0.98},
]
with open(regions_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(region_data[0].keys()))
    writer.writeheader()
    writer.writerows(region_data)
print(f"Written {len(region_data)} regions to {regions_file}")
