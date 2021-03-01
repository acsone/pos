# -*- coding: utf-8 -*-
# © 2015 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "POS Pay Invoice",

    'summary': """Pay invoices inside the POS""",
    'author': 'ACSONE SA/NV,'
              'Odoo Community Association (OCA)',
    'website': "http://acsone.eu",
    'category': 'Point Of Sale',
    'version': '8.0.1.0.0',
    'license': 'AGPL-3',
    'depends': [
        'point_of_sale',
        'pos_cash_deposit',
    ],
    'data': [
        'view/pos_pay_invoice.xml',
    ],
    'qweb': ['static/src/xml/pos_pay_invoice.xml'],
}
