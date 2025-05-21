# Copyright 2025 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    product_restrict_available_warehouse = fields.Boolean(
        string="Show products available in selected warehouses",
    )
    product_available_warehouse_ids = fields.Many2many(
        comodel_name="stock.warehouse",
        string="Only display products that have a quantity available in selected warehouses.",
    )
