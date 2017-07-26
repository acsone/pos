# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo.fields import Datetime
from odoo.tests.common import TransactionCase
from odoo.tools import SUPERUSER_ID


class TestPosOrderCashDeposit(TransactionCase):

    def setUp(self):
        super(TestPosOrderCashDeposit, self).setUp()

        self.AccountObj = self.env['account.account']
        self.BankStatementObj = self.env['account.bank.statement']
        self.JournalObj = self.env['account.journal']
        self.PartnerObj = self.env['res.partner']
        self.PosConfigObj = self.env['pos.config']
        self.PosOrder = self.env['pos.order']
        self.PosSessionObj = self.env['pos.session']
        self.ProductObj = self.env['product.product']

        self.account_receivable = self.env.ref(
            'account.data_account_type_receivable')

        self.partner_1 = self.PartnerObj.create({
            'name': "Test",
            'customer': True,
        })

        self.cash_journal = self.JournalObj.create({
            'name': "Cash",
            'code': "CASH",
            'default_debit_account_id': self.account_receivable.id,
            'default_credit_account_id': self.account_receivable.id,
            'journal_user': True,
            'type': 'cash',
        })

        self.cash_deposit_account = self.AccountObj.create({
            'name': "Cash deposit",
            'code': '4999999',
            'reconcile': True,
            'user_type_id': self.env.ref(
                'account.data_account_type_prepayments').id,
        })

        self.bank_statement = self.BankStatementObj.create({
            'balance_start': 0.0,
            'balance_end_real': 0.0,
            'date': Datetime.now(),
            'journal_id': self.cash_journal.id,
            'name': 'pos session test',
        })

        self.cash_deposit_product = self.ProductObj.create({
            'name': "Cash deposit",
            'taxes_ids': [(6, 0, [])],
            'property_account_income_id': self.cash_deposit_account.id,
        })

        self.pos_config = self.PosConfigObj.create({
            'name': "Cash deposit",
            'picking_type_id': self.env.ref(
                'point_of_sale.picking_type_posout').id,
            'iface_cash_deposit': True,
            'cash_deposit_product_id': self.cash_deposit_product.id,
        })

        self.pos_order_session = self.PosSessionObj.create({
            'user_id': SUPERUSER_ID,
            'config_id': self.pos_config.id
        })

    def test_01_create_cash_deposit(self):
        cash_deposit_amount = 100
        order_dict = {
            'to_invoice': False,
            'data': {
                'name': "Order test",
                'user_id': SUPERUSER_ID,
                'creation_date': Datetime.now(),
                'partner_id': self.partner_1.id,
                'pos_session_id': self.pos_order_session.id,
                'fiscal_position_id': False,
                'sequence_number': 1,
                'amount_tax': 0,
                'amount_total': cash_deposit_amount,
                'amount_paid': cash_deposit_amount,
                'amount_return': 0,
                'lines': [
                    (0, 0, {
                        'product_id': self.cash_deposit_product.id,
                        'price_unit': cash_deposit_amount,
                        'qty': 1,
                        'cash_deposit_msg': "Cash deposit from customer",
                        'tax_ids': [(6, 0, [])],
                    })
                ],
                'statement_ids': [
                    (0, 0, {
                        'name': Datetime.now(),
                        'statement_id': self.bank_statement.id,
                        'journal_id': self.cash_journal.id,
                        'amount': cash_deposit_amount,
                        'account_id': self.account_receivable.id,
                    })
                ]
            }
        }

        order_ids = self.PosOrder.create_from_ui([order_dict])
        self.PosOrder.browse(order_ids).action_pos_order_paid()
        self.pos_order_session.action_pos_session_closing_control()

        self.assertEquals(
            self.partner_1.credit, -cash_deposit_amount,
            msg="Partner should have a credit balance which equals to -%s" %
                cash_deposit_amount)
