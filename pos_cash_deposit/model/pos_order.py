# -*- coding: utf-8 -*-
# © 2015 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp import models, api
import logging

logger = logging.getLogger(__name__)


class pos_order(models.Model):
    _inherit = 'pos.order'

    @api.multi
    def _reconcile_move_account_product(self, move_id, account_id, product_id):
        if move_id and account_id and product_id:
            move_line_obj = self.env['account.move.line']
            move_line_ids = move_line_obj.search([('move_id', '=', move_id),
                                                  ('account_id', '=',
                                                   account_id),
                                                  ('product_id', '=',
                                                   product_id)])
            if move_line_ids:
                try:
                    move_line_ids.reconcile(type='manual',
                                            writeoff_acc_id=False,
                                            writeoff_period_id=False,
                                            writeoff_journal_id=False)
                except Exception as e:
                    logger.warning(
                        'Impossible to reconcile cash deposit items ' + str(e))
            return True

    @api.multi
    def _create_account_move_line(self, session=None, move_id=None):
        res = super(pos_order, self)\
            ._create_account_move_line(session=session, move_id=move_id)
        account_move_line_obj = self.env['account.move.line']
        cash_deposit_product =\
            self.env.ref('pos_cash_deposit.pos_cash_deposit_product')
        income_account = False
        if cash_deposit_product.property_account_income.id:
                income_account = cash_deposit_product\
                    .property_account_income.id
        elif cash_deposit_product.categ_id.property_account_income_categ.id:
                income_account = cash_deposit_product.categ_id\
                    .property_account_income_categ.id
        for order in self:
            if move_id is None:
                move_id = order.move_id.id
            for line in order.lines:
                if line.product_id.id == cash_deposit_product.id:
                    name = line.product_id.name
                    amount = line.price_subtotal
                    sale_journal_id = order.sale_journal.id
                    current_company = order.sale_journal.company_id
                    period = self.env['account.period']\
                        .with_context(company_id=current_company.id).find()[0]
                    if line.notice:
                        name = name + ' (' + line.notice + ')'
                    partner = order.partner_id and \
                        self.pool.get("res.partner").\
                        _find_accounting_partner(order.partner_id) or False
                    default_values = {
                        'name': name,
                        'quantity': line.qty,
                        'product_id': line.product_id.id,
                        'tax_code_id': False,
                        'tax_amount': False,
                        'date': order.date_order[:10],
                        'ref': order.name,
                        'partner_id': partner.id,
                        'journal_id': sale_journal_id,
                        'period_id': period.id,
                        'move_id': move_id,
                        'company_id': current_company.id,
                    }
                    transfert_account_move_values = {
                        'account_id': income_account,
                        'credit': ((amount < 0) and - amount) or 0.0,
                        'debit': ((amount > 0) and amount) or 0.0,
                    }
                    transfert_account_move_values.update(default_values)
                    account_move_line_obj\
                        .create(transfert_account_move_values)
                    receivable_account_move_values = {
                        'account_id': partner.property_account_receivable.id,
                        'credit': ((amount > 0) and amount) or 0.0,
                        'debit': ((amount < 0) and - amount) or 0.0,
                    }
                    receivable_account_move_values.update(default_values)
                    account_move_line_obj\
                        .create(receivable_account_move_values)
        self._reconcile_move_account_product(move_id, income_account,
                                             cash_deposit_product.id)
        return res
