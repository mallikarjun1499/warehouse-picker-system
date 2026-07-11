# Warehouse Picker Route Optimization System

A fully client-side web application that finds the shortest picker route using a **Genetic Algorithm** with **Manhattan Distance** calculations. No server, no database, no login required.

## Quick Start

Because the app uses ES6 modules, serve it with a local HTTP server:

```bash
# Python 3
cd warehouse-picker-system
python -m http.server 8080
# Open: http://localhost:8080

# Node.js
npx serve .

# VS Code: install "Live Server" extension → click "Go Live"
```

> **Firefox users:** can open `index.html` directly from the file system (supports ES modules via file://).

## Workflow

1. **Load Data** → Upload Excel workbook with `Orders` + `Coordinates` sheets (or download the sample)
2. **Orders** → Browse orders, inspect pick lists, assign pickers
3. **Pickers** → Add pickers, assign them to orders
4. **Optimize** → Select order → click Optimize Route → GA runs → see results
5. **Reports** → Download Excel or PDF report

## Excel Format

### `Orders` sheet
```
ORDER_ID
Line | Item           | Pick Location
1    | Part No. 25997 | 57
2    | Part No. 29691 | 37
...

NEXT_ORDER_ID
...
```

### `Coordinates` sheet
```
Location | X  | Y
0        | 1  | 0    ← Depot
57       | 4  | 12
37       | 4  | 7
...
```

## Algorithm

- **Genetic Algorithm**: Binary tournament selection, Ordered Crossover (OX1), swap mutation, elitism
- **Distance**: Warehouse-aware Manhattan distance — same aisle, cross-aisle, cross-block routing
- **Aisles**: x = 1, 4, 7, 10, 13
- **Blocks**: Block 0 (loc 0–150, y 0–16), Block 1 (loc 151–300, y 17–31)

## GA Parameters (adjustable in Optimize sidebar)

| Parameter      | Default | Range    |
|---------------|---------|----------|
| Population    | 50      | 10–200   |
| Max Gen       | 200     | 50–500   |
| Crossover Prob| 0.85    | 0.5–1.0  |
| Mutation Prob | 0.15    | 0.01–0.5 |
| Walking Speed | 84 m/min| 10–300   |

## File Structure

```
warehouse-picker-system/
├── index.html          ← Dashboard
├── load-data.html      ← Excel upload
├── orders.html         ← Order browser
├── pickers.html        ← Picker management
├── optimize.html       ← GA optimization
├── reports.html        ← Export reports
├── assets/
│   ├── css/style.css   ← Dark theme
│   └── js/
│       ├── algorithm.js  ← GA + Manhattan distance
│       ├── app.js        ← State + localStorage
│       ├── excel.js      ← SheetJS parser
│       ├── picker.js     ← Picker CRUD
│       ├── report.js     ← Excel + PDF export
│       └── ui.js         ← Canvas map + components
└── README.md
```

## Libraries (CDN — no install needed)

| Library | Purpose |
|---------|---------|
| Tailwind CSS | Utility CSS |
| Font Awesome 6.5 | Icons |
| AOS 2.3.4 | Scroll animations |
| SheetJS 0.18.5 | Excel read/write |
| jsPDF 2.5.1 | PDF generation |
| jsPDF-AutoTable 3.8.2 | PDF tables |

## Browser Support

Chrome 90+ · Edge 90+ · Firefox 90+ · Safari 15+
