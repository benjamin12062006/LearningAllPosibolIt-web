// Códigos admitidos por los validadores ISO de CreateProjectDto.
const countries = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS
BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN
CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE
EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF
GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM
HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM
JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC
LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK
ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA
NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG
PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS
ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO
TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI
VN VU WF WS YE YT ZA ZM ZW
`
  .trim()
  .split(/\s+/u);
const currencies = `
AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD
BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF
CHW CLF CLP CNY COP COU CRC CUP CVE CZK DJF DKK DOP DZD EGP
ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL
HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF
KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD
MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK
NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF
SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP
SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI
UYU UYW UZS VED VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD
XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL
`
  .trim()
  .split(/\s+/u);

export const DEFAULT_COUNTRY = 'US';
export const DEFAULT_CURRENCY = 'USD';

export function regionOptions(language: string) {
  return options(countries, language, 'region');
}

export function currencyOptions(language: string) {
  return options(currencies, language, 'currency');
}

export function isProjectCountry(value: string) {
  return countries.includes(value);
}

export function isProjectCurrency(value: string) {
  return currencies.includes(value);
}

function options(
  codes: string[],
  language: string,
  type: 'region' | 'currency',
) {
  const names = new Intl.DisplayNames(language, { type });
  const collator = new Intl.Collator(language);
  return codes
    .map((value) => ({ value, label: `${names.of(value)} · ${value}` }))
    .sort((left, right) => collator.compare(left.label, right.label));
}
