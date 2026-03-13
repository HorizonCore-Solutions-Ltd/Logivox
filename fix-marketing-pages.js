const fs = require('fs');

const data = {
  'floor-management': {
    heroTitle: 'Floor & Wave Management',
    heroDesc: 'Optimize Your Warehouse Blueprint. Transform your facility into a high-efficiency flow-through engine. LogiVox uses dynamic wave picking, intelligent marshalling workflows, and real-time floor topology maps to eliminate deadhead travel and accelerate dock-to-stock throughput.',
    f1Title: 'Dynamic Wave Generation',
    f1Desc: 'Group orders automatically based on carrier cut-offs and SLA urgency without manual batching.',
    f2Title: 'Marshalling Optimization',
    f2Desc: 'Organize staging lanes to match exact trailer loading sequences.',
    f3Title: 'Heatmap Tracking',
    f3Desc: 'Visualize forklift and picker movement to eliminate congestion chokepoints.'
  },
  'load-planning': {
    heroTitle: 'Load Planning & Loadsheets',
    heroDesc: 'Maximize Trailer Utilization. Every cubic foot matters. Automatically generate precise, compliant 3D loadsheets. LogiVox algorithms calculate axle weight distribution and drop-sequence loading, guaranteeing drivers spend less time at the gate.',
    f1Title: 'Digital Loadsheets',
    f1Desc: 'Interactive, real-time loadsheets accessible right on mobile scanners and driver tablets.',
    f2Title: 'Drop-Sequence Loading',
    f2Desc: 'Items sorted automatically by delivery route stops (LIFO topology) to prevent dock shuffling.',
    f3Title: 'Weight Compliance',
    f3Desc: 'Prevent DOT fines with automated weight distribution calculations and axle math.'
  },
  'cold-chain': {
    heroTitle: 'Cold Chain Logistics',
    heroDesc: 'Unbreakable Temperature Assurance. Maintain strict FDA and regulatory compliance seamlessly. LogiVox natively integrates with continuous IoT temperature loggers, automating alert chains and quarantine protocols if zones drift outside safe thresholds.',
    f1Title: 'Live IoT Telemetry',
    f1Desc: 'Read instant state data directly from wireless warehouse temperature and humidity probes.',
    f2Title: 'Automated Quarantine',
    f2Desc: 'Self-executing holds on inventory if environmental bounds are breached mid-transit.',
    f3Title: 'Audit-Ready Logs',
    f3Desc: 'Generate instant compliance logs validating integrity for every pallet in the building.'
  }
};

for (const [key, val] of Object.entries(data)) {
  const path = `apps/web/src/app/(marketing)/solutions/${key}/page.tsx`;
  let text = fs.readFileSync(path, 'utf8');

  // Hard string replacement avoiding tricky regex HTML tags
  text = text.replace(/Unlock the power of your supply chain data with LogiVox.*?predictive analytics.*?<\/p>/s, val.heroDesc + "</p>");
  text = text.replace(/>AI Analytics & Forecasting</g, `>${val.heroTitle}<`);
  
  // Replace the features array blindly matching the titles
  text = text.replace(/"Predictive Demand"/g, `"${val.f1Title}"`);
  text = text.replace(/Anticipate order volumes and seasonal trends.*?\"/g, `${val.f1Desc}\"`);
  
  text = text.replace(/"Custom Dashboards"/g, `"${val.f2Title}"`);
  text = text.replace(/Build targeted views for different roles.*?\"/g, `${val.f2Desc}\"`);
  
  text = text.replace(/"Performance Tracking"/g, `"${val.f3Title}"`);
  text = text.replace(/Monitor KPIs across facilities in real-time.*?\"/g, `${val.f3Desc}\"`);
  
  fs.writeFileSync(path, text);
}
console.log("Pages repaired");
