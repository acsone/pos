# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class PosConfig(models.Model):

    _inherit = 'pos.config'

    iface_pay_invoice = fields.Boolean(string="Pay invoice")

    @api.multi
    @api.constrains('iface_cash_deposit', 'iface_pay_invoice')
    def _check_cash_deposit_product(self):
        for rec in self:
            if rec.iface_pay_invoice and not rec.iface_cash_deposit:
                raise ValidationError(
                    _("You must enable cash deposit feature "
                      "to enable pay invoice feature."))

    @api.onchange('iface_pay_invoice')
    def _onchange_iface_pay_invoice(self):
        if self.iface_pay_invoice:
            self.iface_cash_deposit = True
