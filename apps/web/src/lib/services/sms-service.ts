export const sendSMS = async (data: { to: string; message: string }) => {
  console.log(`Mock sending SMS to ${data.to}: ${data.message}`);
  return { success: true };
};
