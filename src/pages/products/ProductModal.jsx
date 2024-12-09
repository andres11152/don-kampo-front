import React from "react";
import { Modal, Select, Button } from "antd";

const { Option } = Select;

const ProductModal = ({
  product,
  visible,
  onCancel,
  selectedVariations,
  quantities,
  handleVariationChange,
  handleIncrement,
  handleDecrement,
  handleInputChange,
  getPriceByUserType,
  handleAddToCart,
}) => {
  const getBase64Image = (photoUrl) =>
    photoUrl || `${process.env.PUBLIC_URL}/images/icon.png`;

  return (
    <Modal
      title={product?.name}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={400}
    >
      {product && (
        <>
          <img
            alt={product.name}
            src={getBase64Image(product.photo_url)}
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />
          <Select
            placeholder="Selecciona calidad"
            style={{ width: "200px", marginBottom: 8 }}
            onChange={(value) =>
              handleVariationChange(product.product_id, "quality", value)
            }
            value={selectedVariations[product.product_id]?.quality}
          >
            {product.variations.map((variation) => (
              <Option key={variation.variation_id} value={variation.quality}>
                {variation.quality}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Selecciona cantidad"
            style={{ width: "200px", marginBottom: 8 }}
            onChange={(value) =>
              handleVariationChange(product.product_id, "quantity", value)
            }
            value={selectedVariations[product.product_id]?.quantity}
          >
            {product.variations.map((variation) => (
              <Option key={variation.variation_id} value={variation.quantity}>
                {variation.quantity}
              </Option>
            ))}
          </Select>

          <div className="quantity-controls">
            <Button onClick={() => handleDecrement(product.product_id)}>-</Button>
            <input
              type="number"
              value={quantities[product.product_id] || 1}
              onChange={(e) => handleInputChange(product.product_id, e.target.value)}
              style={{ width: "50px", textAlign: "center" }}
            />
            <Button onClick={() => handleIncrement(product.product_id)}>+</Button>
          </div>

          <div className="product-price">
            {selectedVariations[product.product_id]?.quality &&
            selectedVariations[product.product_id]?.quantity ? (
              <span>
                Precio: $
                {(
                  getPriceByUserType(
                    product.variations.find(
                      (v) =>
                        v.quality ===
                          selectedVariations[product.product_id]?.quality &&
                        v.quantity ===
                          selectedVariations[product.product_id]?.quantity
                    )
                  ) * (quantities[product.product_id] || 1)
                )
                  .toFixed(2)
                  .replace(/\.00$/, "")
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </span>
            ) : (
              <span>Selecciona calidad y cantidad para ver el precio!</span>
            )}
          </div>

          <Button
            type="primary"
            onClick={() =>
              handleAddToCart(product, quantities[product.product_id] || 1)
            }
            disabled={
              !selectedVariations[product.product_id]?.quality ||
              !selectedVariations[product.product_id]?.quantity
            }
            style={{ marginTop: 8 }}
          >
            Añadir al carrito
          </Button>
        </>
      )}
    </Modal>
  );
};

export default ProductModal;
