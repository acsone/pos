# Copyright 2025 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import models
from odoo.tools import float_compare


class PosSession(models.Model):
    _inherit = "pos.session"

    def _loader_params_product_product(self):
        res = super()._loader_params_product_product()
        config = self.config_id
        if (
            config.product_restrict_available_warehouse
            and config.product_available_warehouse_ids
        ):
            fields = res.get("search_params", {}).get("fields")
            context = res.get("context", {})
            fields.append("qty_available")
            warehouse_ids = config.product_available_warehouse_ids.ids
            context["warehouse"] = warehouse_ids
            res["context"] = context
            res["fields"] = fields
        return res

    def _process_pos_ui_product_product(self, products):
        res = super()._process_pos_ui_product_product(products)
        config = self.config_id
        if (
            config.product_restrict_available_warehouse
            and config.product_available_warehouse_ids
        ):
            self._process_pos_ui_product_product_remove_unavailable_products(products)
        return res

    def _process_pos_ui_product_product_remove_unavailable_products(self, products):
        for product in products[:]:
            if self._process_pos_ui_product_product_check_remove_unavailable_products(
                product
            ):
                products.remove(product)

    def _process_pos_ui_product_product_check_remove_unavailable_products(
        self, product
    ):
        digits = self.env["decimal.precision"].precision_get("Product Unit of Measure")
        return (
            product.get("type") == "product"
            and float_compare(product.get("qty_available"), 0, precision_digits=digits)
            <= 0
        )
