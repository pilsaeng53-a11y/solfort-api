app.post("/sales/submit", (req, res) => {
  try {
    const {
      customerName,
      walletAddress,
      sales,
      price,
      promotion,
      sofAmount,
      quantity
    } = req.body;

    const payload = {
      name: customerName || "",
      wallet: walletAddress || "",
      sales: Number(sales || 0),
      price: Number(price || 0),
      promotion: Number(promotion || 0),
      sofAmount: Number(sofAmount || 0),
      quantity: Number(quantity || 0),
      submittedAt: new Date().toISOString()
    };

    console.log("SALES SUBMIT:", payload);

    return res.json({
      ok: true,
      message: "Sales submission received",
      data: payload
    });
  } catch (error) {
    console.error("SALES SUBMIT ERROR:", error.message);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});
