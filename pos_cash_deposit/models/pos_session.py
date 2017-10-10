# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models, _


class PosSession(models.Model):

    _inherit = 'pos.session'

    def _confirm_orders(self):
        res = super(PosSession, self)._confirm_orders()
        for session in self:
            orders = session.order_ids.filtered(
                lambda order: order.state in ['invoiced', 'done'])
            orders.create_and_reconcile_cash_deposit_entries()
        return res
