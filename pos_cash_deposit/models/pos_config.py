# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class PosConfig(models.Model):

    _inherit = 'pos.config'

    iface_cash_deposit = fields.Boolean(string="Cash deposit")
    cash_deposit_product_id = fields.Many2one(
        comodel_name='product.product', string="Cash deposit product")

    @api.multi
    @api.constrains('iface_cash_deposit', 'cash_deposit_product_id')
    def _check_cash_deposit_product(self):
        for rec in self:
            if rec.is_cash_deposit_product_required():
                raise ValidationError(
                    _("You must set a cash deposit product if you "
                      "enable cash deposit feature."))

    @api.multi
    def is_cash_deposit_product_required(self):
        self.ensure_one()
        return self.iface_cash_deposit and not self.cash_deposit_product_id
