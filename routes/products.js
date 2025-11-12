const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");
const { authMiddleware, requireAdmin } = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();

/* ============================================================
   📦 CLOUDINARY STORAGE
============================================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    allowed_formats: ["jpg", "png", "webp"],
  },
});
const upload = multer({ storage, limits: { fileSize: 3 * 1024 * 1024 } });

/* ============================================================
   🟢 PUBLIC ROUTES
============================================================ */
router.get("/public", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

router.get("/public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Error fetching product", error: err.message });
  }
});

/* ============================================================
   🔒 ADMIN ROUTES
============================================================ */

/* Fetch all products (Admin) */
router.get("/", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching products", error: err.message });
  }
});

/* ✅ Get single product (Admin Edit Modal) */
router.get("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    console.error("Get single product error:", err);
    res.status(500).json({ message: "Failed to load product", error: err.message });
  }
});

/* CREATE PRODUCT */
router.post("/", authMiddleware, requireAdmin, upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, actualPrice, offerPrice, category } = req.body;
    if (!title || !actualPrice || !category)
      return res.status(400).json({ message: "Title, price & category required" });

    const imageUrls = req.files.map(file => file.path);
    const newProduct = new Product({
      title,
      description,
      actualPrice: parseFloat(actualPrice),
      offerPrice: parseFloat(offerPrice) || 0,
      category,
      images: imageUrls,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Failed to create product", error: err.message });
  }
});

/* UPDATE PRODUCT (Replace images if new uploaded) */
router.put("/:id", authMiddleware, requireAdmin, upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, actualPrice, offerPrice, category } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // 🧹 If new images uploaded → delete old ones on Cloudinary
    if (req.files && req.files.length > 0) {
      if (product.images?.length > 0) {
        for (const url of product.images) {
          try {
            const publicId = url.split("/").slice(-1)[0].split(".")[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
          } catch (delErr) {
            console.warn("⚠️ Cloudinary delete failed:", delErr.message);
          }
        }
      }
      product.images = req.files.map(f => f.path);
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.actualPrice = actualPrice ? parseFloat(actualPrice) : product.actualPrice;
    product.offerPrice = offerPrice ? parseFloat(offerPrice) : product.offerPrice;
    product.category = category || product.category;

    await product.save();
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to update product", error: err.message });
  }
});

/* DELETE PRODUCT */
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });

    // delete images from Cloudinary
    if (product.images?.length > 0) {
      for (const url of product.images) {
        try {
          const publicId = url.split("/").slice(-1)[0].split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (delErr) {
          console.warn("⚠️ Cloudinary delete failed:", delErr.message);
        }
      }
    }

    await product.deleteOne();
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
});

module.exports = router;
