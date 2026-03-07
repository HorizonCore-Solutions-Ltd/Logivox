# How to Receive Purchase Orders (Inbound)

This guide takes you through the process of receiving inbound inventory and updating stock levels in LogiVox.

## Prerequisites

- A barcode scanner (or mobile device) signed into the LogiVox App.
- Your user account must have 'Receiving' or 'Admin' permissions.

## Step-by-Step Receiving

1. **Navigate to Inbound:** From the main dashboard, click on **Inbound** -> **Expected Receipts** or **Purchase Orders**.
2. **Select the PO:** Search for the PO number provided by the delivery driver or select it from the 'Scheduled Today' list.
3. **Scan Master LPN:** If the pallet has an ASN (Advance Shipping Notice) license plate, scan it to immediately map all expected cartons to the dock door.
4. **Blind Receiving (Manual Entry):** If the items are un-barcoded:
   - Click `New Receipt Line`
   - Select the SKU from the dropdown.
   - Enter the Qty received.
   - Click `Confirm`.
5. **Close the PO:** Once all quantities are verified against the packing slip, click **Close & Generate Putaway Tasks**.

_Note: Generating Putaway tasks will instruct your forklift operators where to store the newly received inventory based on your facility's putaway logic._
