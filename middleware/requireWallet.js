function requireWallet(req, res, next) {
  const walletAddress = req.headers["x-wallet-address"] || req.body.walletAddress;

  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet not connected" });
  }

  req.wallet = { address: walletAddress };
  next();
}

module.exports = {
  requireWallet
};
