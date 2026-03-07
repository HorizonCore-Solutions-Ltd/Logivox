# How to Plan and Release Outbound Waves

Wave planning allows you to group orders together (e.g., Next Day Air, single-line orders, or specific carriers) to optimize your warehouse pickers' walking paths.

## 1. Creating a Wave Template

If you regularly run the same type of wave (e.g., "Morning FedEx Ground"), you should create a Template.

1. Go to **Outbound** -> **Wave Rules**.
2. Click **New Template**.
3. Select your criteria (e.g., Carrier = FedEx, Status = Pending, Facility = Dallas).
4. Save as "Morning FedEx."

## 2. Releasing a Wave

1. Navigate to **Outbound** -> **Wave Dashboard**.
2. Click **Generate Wave** and select your Template (or manually filter the current order pool).
3. The system will group the eligible orders.
4. Click **Release Wave**.

## 3. What Happens Next?

Once released:

- The system checks inventory availability (Shortage Check).
- Pick tasks are generated and sent to the mobile scanners of your active pickers.
- Orders change from status `Pending` to `Waving`.
