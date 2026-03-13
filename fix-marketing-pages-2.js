const fs = require('fs');

const data = {
  'hazmat-compliance': {
    heroTitle: 'Hazmat & Compliance',
    heroDesc: 'Fail-Safe Regulatory Control. Protect your people and operations. Enforce strict spatial separation rules for hazardous materials instantly. LogiVox checks inbound manifests against DOT/IATA regulations and forces compliant putaway logic automatically.',
    f1Title: 'Segregation Engine',
    f1Desc: 'Automatically prevents incompatible chemical classes from being slotted safely together.',
    f2Title: 'SDS Management',
    f2Desc: 'Digital Safety Data Sheets appended to every related forklift picking task.',
    f3Title: 'Incident CAPA',
    f3Desc: 'Integrated Corrective and Preventive Action logs for immediate warehouse resolution.'
  },
  'procurement': {
    heroTitle: 'Procurement & Supplier B2B',
    heroDesc: 'Unified Inbound Sourcing. Bring your suppliers into the same zero-latency loop as your warehouse. LogiVox offers dedicated vendor portals, automated reorder triggers, and transparent three-way matching.',
    f1Title: 'Supplier Portals',
    f1Desc: 'Give vendors a secure window to acknowledge POs and submit ASNs.',
    f2Title: 'Three-Way Match',
    f2Desc: 'Automatically verify PO, receiving dock counts, and supplier invoices.',
    f3Title: 'Automated Reorders',
    f3Desc: 'Automatically draft purchase orders when safety stock hits critical lows.'
  },
  'iot-telematics': {
    heroTitle: 'IoT Telematics',
    heroDesc: 'Next-Gen Asset Tracking. Deploy an invisible safety net across your MHE fleet. LogiVox tracks forklifts, assets, and operator telemetry in real time—pinpointing impacts and driving speeds.',
    f1Title: 'Impact Detection',
    f1Desc: 'Instantly log collision events and trigger mandatory vehicle inspections.',
    f2Title: 'Access Control',
    f2Desc: 'Restrict ignition on forklifts to certified, trained personnel only.',
    f3Title: 'Battery Analytics',
    f3Desc: 'Track charge cycles and optimize fleet rotation to prevent mid-shift downs.'
  }
};

for (const [key, val] of Object.entries(data)) {
  const path = `apps/web/src/app/(marketing)/solutions/${key}/page.tsx`;
  let text = fs.readFileSync(path, 'utf8');

  text = text.replace(/Unlock the power of your supply chain data with LogiVox.*?predictive analytics.*?<\/p>/s, val.heroDesc + "</p>");
  text = text.replace(/>AI Analytics & Forecasting</g, `>${val.heroTitle}<`);
  
  text = text.replace(/"Predictive Demand"/g, `"${val.f1Title}"`);
  text = text.replace(/Anticipate order volumes and seasonal trends.*?\"/g, `${val.f1Desc}\"`);
  
  text = text.replace(/"Custom Dashboards"/g, `"${val.f2Title}"`);
  text = text.replace(/Build targeted views for different roles.*?\"/g, `${val.f2Desc}\"`);
  
  text = text.replace(/"Performance Tracking"/g, `"${val.f3Title}"`);
  text = text.replace(/Monitor KPIs across facilities in real-time.*?\"/g, `${val.f3Desc}\"`);
  
  fs.writeFileSync(path, text);
}
console.log("Pages repaired part 2");
