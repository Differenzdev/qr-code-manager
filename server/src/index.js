const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` QR Code Management System Running on Port ${PORT}`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
