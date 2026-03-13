const fs = require('fs');

const data = {
  'floor-management': {
    heroTitle: 'Warehouse Floor & Wave Management',
    heroDesc: 'Optimize Your Warehouse Blueprint. Transform your facility into a high-efficiency flow-through engine. LogiVox uses dynamic wave picking, intelligent marshalling workflows, and real-time floor topology maps to eliminate deadhead travel and accelerate dock-to-stock throughput.',
    title: 'Floor Management',
  },
  'load-planning': {
    heroTitle: 'Load Planning & Loadsheets',
    heroDesc: 'Maximize Trailer Utilization. Every cubic foot matters. Automatically generate precise, compliant 3D loadsheets. LogiVox algorithms calculate axle weight distribution and drop-sequence loading, guaranteeing drivers spend less time at the gate.',
    title: 'Load Planning',
  },
  'cold-chain': {
    heroTitle: 'Cold Chain Logistics',
    heroDesc: 'Unbreakable Temperature Assurance. Maintain strict FDA and regulatory compliance seamlessly. LogiVox natively integrates with continuous IoT temperature loggers, automating alert chains and quarantine protocols if zones drift outside safe thresholds.',
    title: 'Cold Chain',
  },
  'hazmat-compliance': {
    heroTitle: 'Hazmat & Regulatory Compliance',
    heroDesc: 'Fail-Safe Regulatory Control. Protect your people and operations. Enforce strict spatial separation rules for hazardous materials instantly. LogiVox checks inbound manifests against DOT/IATA regulations and forces compliant putaway logic automatically.',
    title: 'Hazmat Compliance',
  },
  'procurement': {
    heroTitle: 'Procurement & Supplier Portals',
    heroDesc: 'Unified Inbound Sourcing. Bring your suppliers into the same zero-latency loop as your warehouse. LogiVox offers dedicated vendor portals, automated reorder triggers, and transparent three-way matching.',
    title: 'Supplier B2B Procurement',
  },
  'iot-telematics': {
    heroTitle: 'IoT Forklift Telematics',
    heroDesc: 'Next-Gen Asset Tracking. Deploy an invisible safety net across your MHE fleet. LogiVox tracks forklifts, assets, and operator telemetry in real time—pinpointing impacts and driving speeds.',
    title: 'Active IoT Telematics',
  }
};

for (const [key, val] of Object.entries(data)) {
  const path = `apps/web/src/app/(marketing)/solutions/${key}/page.tsx`;
  let text = fs.readFileSync(path, 'utf8');

  // Nuke all the analytics references and replace with the specific module data
  text = text.replace(/Advanced Analytics/g, val.heroTitle);
  text = text.replace(/Transform raw data into actionable insights.*?predictive intelligence\./gs, val.heroDesc);
  text = text.replace(/AnalyticsPage/g, val.title.replace(/\s+/g, '') + 'Page');
  text = text.replace(/Analytics Modules/g, val.title + ' Modules');
  text = text.replace(/See Analytics Demo/g, 'See ' + val.title + ' Demo');
  text = text.replace(/Our analytics platform/g, 'Our ' + val.title + ' platform');
  text = text.replace(/LogiVox Analytics/g, 'LogiVox ' + val.title);

  fs.writeFileSync(path, text);
}
console.log("Analytics texts cleansed.");
