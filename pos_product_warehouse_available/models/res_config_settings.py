# Copyright 2025 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    pos_config_product_restrict_available_warehouse = fields.Boolean(
        related="pos_config_id.product_restrict_available_warehouse",
        readonly=False,
    )
    pos_config_product_available_warehouse_ids = fields.Many2many(
        related="pos_config_id.product_available_warehouse_ids",
        readonly=False,
    )
