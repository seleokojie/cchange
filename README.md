# CChange

Geographical Simulation of Climate Change

This application is a 3D geographical simulation of the rise of temperatures on the Earth from 1910 to 2010. The simulation offers an immersive experience, allowing users to explore and interact with a realistic model of the Earth while filtering temperature data by decade.

## Data Sources

This project uses temperature anomaly data from **NASA Goddard Institute for Space Studies (GISS)**:

- **Data Source**: [NASA GISS Surface Temperature Analysis](https://data.giss.nasa.gov/gistemp/)
- **Dataset**: GISTEMP - Global Surface Temperature Anomalies
- **Coverage**: Historical temperature data from 1880 to present
- **Attribution**: We acknowledge NASA GISS for providing publicly available climate data that makes this visualization possible.

The NASA GISS temperature dataset represents one of the most comprehensive and reliable sources of global surface temperature records, enabling accurate historical climate visualization and analysis.

## Development Setup

**Prerequisites:** Node.js (download from [nodejs.org](https://nodejs.org/en/download/))

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the application:**

   ```bash
   npm run build          # Production build
   npm run build:dev      # Development build
   npm run dev            # Development build with watch mode
   ```

3. **Run the application:**

   ```bash
   npm start              # Build and serve
   npm run serve          # Serve existing build
   ```

4. **Access the application:**
   Open your browser to: <http://localhost:8080>
