#!/usr/bin/env python3
"""Build survey-data.json from the Al Falah CUBE Excel file."""

import hashlib
import json
import os
import sys

import pandas as pd

EXCEL_PATH = os.environ.get(
    'AL_FALAH_EXCEL',
    '/Users/fatimas/Desktop/SCAD/Al Falah Dashboard/wetransfer_al-falah_cube_final-demo-xlsx_2026-08-05_1344/Al Falah_CUBE_Final - Demo.xlsx',
)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'data', 'survey-data.json')
TRANSLATIONS_PATH = os.path.join(os.path.dirname(__file__), 'ar-en-map.json')


def load_translations():
    if os.path.exists(TRANSLATIONS_PATH):
        with open(TRANSLATIONS_PATH, encoding='utf-8') as f:
            return json.load(f)
    return {}


def translate(text, translations):
    if text is None:
        return ''
    text = str(text).strip()
    return translations.get(text, text)

SECTION_MAP = {
    '1 - الدخل والمعيشة': {'id': 'income', 'en': 'Income & Living', 'order': 1},
    '2 - العمل': {'id': 'work', 'en': 'Work', 'order': 2},
    '3 - التعليم': {'id': 'education', 'en': 'Education', 'order': 3},
    '4 - الأمن والسلامة': {'id': 'security', 'en': 'Security & Safety', 'order': 4},
    '5 - الصحة': {'id': 'health', 'en': 'Health', 'order': 5},
    '6 - البيئة المحيطة': {'id': 'environment', 'en': 'Environment', 'order': 6},
    '7 - المسكن': {'id': 'housing', 'en': 'Housing', 'order': 7},
    '8 - البنية التحتية': {'id': 'infrastructure', 'en': 'Infrastructure', 'order': 8},
    '9 - البيانات الديموغرافية': {'id': 'demographics', 'en': 'Demographics', 'order': 9},
}


def seeded_value(key, year, min_v=0, max_v=100):
    h = int(hashlib.md5(f'{key}_{year}'.encode()).hexdigest(), 16)
    return round(min_v + (h % 1000) / 1000 * (max_v - min_v), 1)


def get_actual_or_demo(row, year):
    vp = row.get('valid_percent')
    if pd.notna(vp):
        return float(vp)
    ag = row.get('Agreement Percentage (%)')
    if pd.notna(ag):
        return float(ag)
    key = f"{row.get('question_code')}_{row.get('dimension_value_ar')}_{row.get('scale_point_ar')}"
    qtype = row.get('question_type')
    if qtype in ('likert', 'rating'):
        if row.get('scale_point_ar') in ('الإجمالي', None):
            return seeded_value(key, year, 55, 85)
        return seeded_value(key, year, 2, 35)
    if qtype == 'categorical':
        return seeded_value(key, year, 5, 45)
    if qtype == 'multi_select':
        return seeded_value(key, year, 8, 55)
    if qtype == 'mean':
        return seeded_value(key, year, 2, 6)
    return None


def main():
    if not os.path.exists(EXCEL_PATH):
        print(f'Excel file not found: {EXCEL_PATH}', file=sys.stderr)
        sys.exit(1)

    translations = load_translations()
    df = pd.read_excel(EXCEL_PATH)
    has_real_data = df['valid_percent'].notna().any() or df['Agreement Percentage (%)'].notna().any()

    section_scores = {}
    for _, row in df[df['question_type'] == 'section_score'].iterrows():
        sec = row['section_name']
        key = SECTION_MAP[sec]['id']
        s2024 = row['section_score_2024']
        s2025 = row['section_score_2025']
        p2024 = row['positive_score_2024']
        p2025 = row['positive_score_2025']
        n2024 = row['negative_score_2024']
        n2025 = row['negative_score_2025']
        if pd.isna(s2024):
            s2024 = seeded_value(f'score_{key}', 2024, 62, 78)
        if pd.isna(s2025):
            s2025 = seeded_value(f'score_{key}', 2025, 64, 82)
        if pd.isna(p2024):
            p2024 = seeded_value(f'pos_{key}', 2024, 58, 75)
        if pd.isna(p2025):
            p2025 = seeded_value(f'pos_{key}', 2025, 60, 78)
        if pd.isna(n2024):
            n2024 = seeded_value(f'neg_{key}', 2024, 8, 22)
        if pd.isna(n2025):
            n2025 = seeded_value(f'neg_{key}', 2025, 6, 20)
        section_scores[key] = {
            'sectionId': key,
            'sectionNameEn': SECTION_MAP[sec]['en'],
            'sectionNameAr': sec.split(' - ')[1] if ' - ' in sec else sec,
            'score2024': round(float(s2024), 1),
            'score2025': round(float(s2025), 1),
            'yoyChange': round(float(s2025) - float(s2024), 1),
            'positive2024': round(float(p2024), 1),
            'positive2025': round(float(p2025), 1),
            'negative2024': round(float(n2024), 1),
            'negative2025': round(float(n2025), 1),
        }

    sections = {}
    for sec_name, meta in SECTION_MAP.items():
        sec_df = df[df['section_name'] == sec_name]
        questions = []
        for qcode in sec_df['question_code'].unique():
            if qcode.startswith('SCORE') or qcode.startswith('SUBSCORE'):
                continue
            qdf = sec_df[sec_df['question_code'] == qcode]
            qtype = qdf['question_type'].iloc[0]
            qlabel = qdf['question_label_ar'].iloc[0]

            if qtype in ('likert', 'rating'):
                for stmt in qdf['dimension_value_ar'].dropna().unique():
                    scale_data = {}
                    for year in [2024, 2025]:
                        year_df = qdf[(qdf['dimension_value_ar'] == stmt) & (qdf['year'] == year)]
                        breakdown = {}
                        agreement = None
                        for _, r in year_df.iterrows():
                            sp = r['scale_point_ar']
                            if pd.isna(sp):
                                continue
                            val = get_actual_or_demo(r, year)
                            if sp == 'الإجمالي':
                                agreement = val
                            else:
                                breakdown[str(sp)] = val
                        if agreement is None and breakdown:
                            pos_keys = ['موافق بشدة', 'موافق', 'جيدة', 'ممتازة', 'إلى حدٍ كبير جداً', 'إلى حدٍ كبير']
                            agreement = sum(breakdown.get(k, 0) for k in pos_keys)
                        scale_data[str(year)] = {'agreement': agreement, 'breakdown': breakdown}
                    questions.append({
                        'code': qcode,
                        'type': qtype,
                        'labelAr': qlabel,
                        'labelEn': translate(qlabel, translations),
                        'statementAr': str(stmt),
                        'statementEn': translate(str(stmt), translations),
                        'data': scale_data,
                    })
            elif qtype in ('categorical', 'multi_select'):
                for cat in qdf['dimension_value_ar'].dropna().unique():
                    cat_data = {}
                    for year in [2024, 2025]:
                        row = qdf[(qdf['dimension_value_ar'] == cat) & (qdf['year'] == year)]
                        if len(row) == 0:
                            continue
                        val = get_actual_or_demo(row.iloc[0], year)
                        cat_data[str(year)] = val
                    questions.append({
                        'code': qcode,
                        'type': qtype,
                        'labelAr': qlabel,
                        'labelEn': translate(qlabel, translations),
                        'categoryAr': str(cat),
                        'categoryEn': translate(str(cat), translations),
                        'data': cat_data,
                    })
            elif qtype == 'mean':
                for dim in qdf['dimension_value_ar'].dropna().unique():
                    dim_data = {}
                    for year in [2024, 2025]:
                        row = qdf[(qdf['dimension_value_ar'] == dim) & (qdf['year'] == year)]
                        if len(row) == 0:
                            continue
                        val = get_actual_or_demo(row.iloc[0], year)
                        dim_data[str(year)] = val
                    questions.append({
                        'code': qcode,
                        'type': qtype,
                        'labelAr': qlabel,
                        'labelEn': translate(qlabel, translations),
                        'dimensionAr': str(dim),
                        'dimensionEn': translate(str(dim), translations),
                        'data': dim_data,
                    })

        sections[meta['id']] = {
            'id': meta['id'],
            'nameEn': meta['en'],
            'nameAr': sec_name.split(' - ')[1] if ' - ' in sec_name else sec_name,
            'order': meta['order'],
            'score': section_scores.get(meta['id']),
            'questions': questions,
        }

    all_scores = list(section_scores.values())
    avg_2024 = round(sum(s['score2024'] for s in all_scores) / len(all_scores), 1)
    avg_2025 = round(sum(s['score2025'] for s in all_scores) / len(all_scores), 1)

    output = {
        'district': 'Al Falah',
        'districtAr': 'الفلاح',
        'years': [2024, 2025],
        'updatedAt': 'Aug 2025',
        'overview': {
            'overallScore2024': avg_2024,
            'overallScore2025': avg_2025,
            'overallYoyChange': round(avg_2025 - avg_2024, 1),
            'bestImproved': {
                'section': max(all_scores, key=lambda s: s['yoyChange'])['sectionNameEn'],
                'change': max(all_scores, key=lambda s: s['yoyChange'])['yoyChange'],
            },
            'mostDeclined': {
                'section': min(all_scores, key=lambda s: s['yoyChange'])['sectionNameEn'],
                'change': min(all_scores, key=lambda s: s['yoyChange'])['yoyChange'],
            },
            'highestScore': {
                'section': max(all_scores, key=lambda s: s['score2025'])['sectionNameEn'],
                'score': max(all_scores, key=lambda s: s['score2025'])['score2025'],
            },
            'lowestScore': {
                'section': min(all_scores, key=lambda s: s['score2025'])['sectionNameEn'],
                'score': min(all_scores, key=lambda s: s['score2025'])['score2025'],
            },
        },
        'sectionScores': section_scores,
        'sections': sections,
        'isDemoData': not has_real_data,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f'Written {OUTPUT_PATH}')
    print(f'Demo data: {not has_real_data}')


if __name__ == '__main__':
    main()
