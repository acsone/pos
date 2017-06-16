# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import logging

from odoo import models, api

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    @api.multi
    def _create_account_move_line(self, session=None, move=None):
        res = super(PosOrder, self)._create_account_move_line(
            session=session, move=move)
        self.create_and_reconcile_cash_deposit_entries(move=move)
        return res

    @api.multi
    def create_and_reconcile_cash_deposit_entries(self, move=None):
        for order in self:
            move = move and move or order.account_move
            cash_deposit_product = order.config_id.cash_deposit_product_id

            for line in order.lines:
                product = line.product_id

                if product != cash_deposit_product:
                    continue

                default_line_values = order._prepare_cash_deposit_line_values(
                    line, move=move)
                transfer_line_values = \
                    order._prepare_cash_deposit_line_transfer_values(
                        line, defaults=default_line_values, move=move)
                receivable_line_values = \
                    order._prepare_cash_deposit_line_receivable_values(
                        line, defaults=default_line_values, move=move)

                move.write({
                    'line_ids': [
                        (0, 0, transfer_line_values),
                        (0, 0, receivable_line_values),
                    ]
                })
                order.reconcile_cash_deposit_entries(
                    cash_deposit_product, move)

    @api.multi
    def reconcile_cash_deposit_entries(self, product, move):
        self.ensure_one()
        MoveLineObj = self.env['account.move.line']
        account_id = False

        if product.property_account_income_id:
            account_id = product.property_account_income_id.id
        elif product.categ_id.property_account_income_categ_id:
            account_id = product.categ_id.property_account_income_categ_id.id

        MoveLineObj.search([
            ('move_id', '=', move.id),
            ('account_id', '=', account_id),
            ('product_id', '=', product.id),
            ('partner_id', '=', self._get_accounting_partner().id),
        ]).reconcile()

    @api.multi
    def _get_accounting_partner(self):
        self.ensure_one()
        PartnerObj = self.env['res.partner']
        partner = PartnerObj._find_accounting_partner(
            self.partner_id) or self.partner_id
        return partner

    @api.multi
    def _prepare_cash_deposit_line_values(self, order_line, move=None):
        self.ensure_one()
        partner = self._get_accounting_partner()
        sale_journal = self.sale_journal
        product = order_line.product_id
        name = product.name

        if order_line.cash_deposit_msg:
            name = '%s (%s)' % (name, order_line.cash_deposit_msg)

        values = {
            'name': name,
            'quantity': order_line.qty,
            'product_id': product.id,
            'date': self.date_order[:10],
            'ref': self.name,
            'partner_id': partner.id,
            'journal_id': sale_journal.id,
            'move_id': move and move.id or self.account_move.id,
            'company_id': self.company_id.id,
        }
        return values

    @api.multi
    def _prepare_cash_deposit_line_transfer_values(
            self, order_line, defaults=None, move=None):
        self.ensure_one()

        values = defaults.copy() or self._prepare_cash_deposit_line_values(
            order_line, move=move)

        amount = order_line.price_subtotal
        product = order_line.product_id
        account_id = False

        if product.property_account_income_id:
            account_id = product.property_account_income_id.id
        elif product.categ_id.property_account_income_categ_id:
            account_id = product.categ_id.property_account_income_categ_id.id

        values.update({
            'account_id': account_id,
            'credit': ((amount < 0) and - amount) or 0.0,
            'debit': ((amount > 0) and amount) or 0.0,
        })
        return values

    @api.multi
    def _prepare_cash_deposit_line_receivable_values(
            self, order_line, defaults=None, move=None):

        values = defaults.copy() or self._prepare_cash_deposit_line_values(
            order_line, move=move)
        amount = order_line.price_subtotal
        partner = self._get_accounting_partner()

        values.update({
            'account_id': partner.property_account_receivable_id.id,
            'credit': ((amount > 0) and amount) or 0.0,
            'debit': ((amount < 0) and - amount) or 0.0,
        })
        return values
