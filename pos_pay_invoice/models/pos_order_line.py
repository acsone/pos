# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class PosOrderLine(models.Model):

    _inherit = 'pos.order.line'

    invoice_id = fields.Many2one(
        comodel_name='account.invoice', string="Invoice", readonly=True)
