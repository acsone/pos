# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import models, fields


class PosOrderLine(models.Model):
    _inherit = 'pos.order.line'

    cash_deposit_msg = fields.Char(string="Cash deposit message")
