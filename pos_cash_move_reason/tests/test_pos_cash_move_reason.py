# © 2015 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo.addons.account.tests.common import AccountTestInvoicingCommon

class TestPosCashMoveReason(AccountTestInvoicingCommon):

    @classmethod
    def setUpClass(cls, chart_template_ref=None):
        super().setUpClass(chart_template_ref=chart_template_ref)
        cls.env = cls.env(context=dict(cls.env.context, tracking_disable=True))
        cls.PosSession = cls.env["pos.session"]
        cls.WizardReason = cls.env["wizard.pos.move.reason"]
        cls.AccountMoveLine = cls.env["account.move.line"]

        cls.config = cls.env.ref("point_of_sale.pos_config_main").copy()
        cls.cash_journal = cls.company_data['default_journal_cash'],
        cls.deposit_reason = cls.env.ref("pos_cash_move_reason.bank_out_reason")

    def test_take_money(self):
        # Open New Session
        self.config.open_session_cb()
        session = self.PosSession.search(
            [("state", "=", "opened"), ("config_id", "=", self.config.id)]
        )

        # Get Cash Statement
        statement = session.statement_ids.filtered(
            lambda x: x.journal_id == self.cash_journal.id
        )

        # Take money to put in Bank
        wizard = self.WizardReason.with_context(
            active_id=session.id, default_move_type="expense"
        ).create(
            {
                "move_reason_id": self.deposit_reason.id,
                "journal_id": self.cash_journal.id,
                "statement_id": statement.id,
                "amount": 500,
                "name": "Test Bank Deposit",
            }
        )
        wizard.apply()
        session.action_pos_session_closing_control()

        # I get all move lines of this statement
        move_line = self.env["account.move.line"].search(
            [
                ("account_id", "=", self.deposit_reason.expense_account_id.id),
                ("debit", "=", 500.0),
                ("id", "in", statement.move_line_ids.ids),
            ]
        )
        # I check the created move line from the cash in
        self.assertEquals(len(move_line), 1)
