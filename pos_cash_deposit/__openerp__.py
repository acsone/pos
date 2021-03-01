# -*- coding: utf-8 -*-
# © 2015 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "POS Cash Deposit",

    'summary': """Cash deposit inside the POS""",
    'author': 'ACSONE SA/NV,'
              'Odoo Community Association (OCA)',
    'website': "http://acsone.eu",
    'category': 'Point Of Sale',
    'version': '8.0.1.0.0',
    'license': 'AGPL-3',
    'depends': [
        'point_of_sale',
    ],
    'data': [
        "view/pos_cash_deposit.xml",
        "data/pos_cash_deposit_product.xml",
    ],
    'qweb': ['static/src/xml/pos_cash_deposit.xml'],
}
