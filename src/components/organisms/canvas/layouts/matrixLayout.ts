import { FrameworkType, type NodeRole } from '@/types'

export interface MatrixCellConfig {
  role: NodeRole
  label: string
  color: string
}

export interface MatrixConfig {
  cells: MatrixCellConfig[][]
  rows: number
  cols: number
}

const c = {
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#6366f1',
  slate: '#94a3b8',
  yellow: '#f59e0b',
  pink: '#ec4899',
}

export function getMatrixConfig(framework: FrameworkType): MatrixConfig {
  switch (framework) {
    case FrameworkType.SWOT:
      return {
        rows: 2,
        cols: 2,
        cells: [
          [
            { role: 'strength', label: '強み\nStrength', color: c.green },
            { role: 'opportunity', label: '機会\nOpportunity', color: c.blue },
          ],
          [
            { role: 'weakness', label: '弱み\nWeakness', color: c.orange },
            { role: 'threat', label: '脅威\nThreat', color: c.red },
          ],
        ],
      }
    case FrameworkType.ANSOFF:
      return {
        rows: 2,
        cols: 2,
        cells: [
          [
            { role: 'market-penetration', label: '市場浸透\n既存市場×既存製品', color: c.green },
            { role: 'product-development', label: '新製品開発\n既存市場×新製品', color: c.blue },
          ],
          [
            { role: 'market-development', label: '市場開拓\n新市場×既存製品', color: c.orange },
            { role: 'diversification', label: '多角化\n新市場×新製品', color: c.red },
          ],
        ],
      }
    case FrameworkType.CROSS_SWOT:
      return {
        rows: 2,
        cols: 2,
        cells: [
          [
            { role: 'so_strategy', label: 'SO戦略\n強み×機会', color: c.green },
            { role: 'wo_strategy', label: 'WO戦略\n弱み×機会', color: c.blue },
          ],
          [
            { role: 'st_strategy', label: 'ST戦略\n強み×脅威', color: c.orange },
            { role: 'wt_strategy', label: 'WT戦略\n弱み×脅威', color: c.red },
          ],
        ],
      }
    case FrameworkType.PRIORITY_MATRIX:
      return {
        rows: 2,
        cols: 2,
        cells: [
          [
            { role: 'high_impact_easy', label: '最優先\n効果大×簡単', color: c.green },
            { role: 'high_impact_hard', label: '中長期\n効果大×難しい', color: c.blue },
          ],
          [
            { role: 'low_impact_easy', label: '余力で\n効果小×簡単', color: c.orange },
            { role: 'low_impact_hard', label: 'やらない\n効果小×難しい', color: c.red },
          ],
        ],
      }
    case FrameworkType.PPM:
      return {
        rows: 2,
        cols: 2,
        cells: [
          [
            { role: 'star', label: '花形\n高成長×高シェア', color: c.yellow },
            { role: 'question_mark', label: '問題児\n高成長×低シェア', color: c.blue },
          ],
          [
            { role: 'cash_cow', label: '金のなる木\n低成長×高シェア', color: c.green },
            { role: 'dog', label: '負け犬\n低成長×低シェア', color: c.slate },
          ],
        ],
      }
    case FrameworkType.THREE_C:
      return oneRow([
        ['customer', 'Customer\n顧客', c.blue],
        ['competitor', 'Competitor\n競合', c.red],
        ['company', 'Company\n自社', c.green],
      ])
    case FrameworkType.PEST:
      return grid2([
        ['political', 'Politics\n政治・法律', c.blue],
        ['economic', 'Economy\n経済', c.green],
        ['social', 'Society\n社会・文化', c.orange],
        ['technological', 'Technology\n技術', c.purple],
      ])
    case FrameworkType.AS_IS_TO_BE:
      return oneRow([
        ['as_is', 'As-Is\n現状', c.slate],
        ['gap', 'Gap\n差分', c.orange],
        ['to_be', 'To-Be\n理想', c.green],
        ['action', 'Action\n打ち手', c.blue],
      ])
    case FrameworkType.BUSINESS_FLOW:
      return oneRow([
        ['flow_input', '入力\n受付・依頼', c.purple],
        ['flow_process', '処理\n作業・計算', c.blue],
        ['flow_decision', '判断\n承認・決裁', c.orange],
        ['flow_output', '出力\n作成・発行', c.green],
        ['flow_storage', '保管\n保存・記録', c.slate],
        ['flow_share', '共有\n報告・連絡', c.pink],
      ])
    case FrameworkType.ECRS:
      return oneRow([
        ['eliminate', 'Eliminate\nなくせないか', c.red],
        ['combine', 'Combine\nまとめられないか', c.orange],
        ['rearrange', 'Rearrange\n順番を変えられないか', c.blue],
        ['simplify', 'Simplify\n簡単にできないか', c.green],
      ])
    case FrameworkType.FOUR_M:
      return oneRow([
        ['man', 'Man\n人・スキル', c.purple],
        ['machine', 'Machine\n設備・ツール', c.blue],
        ['material', 'Material\n情報・データ', c.orange],
        ['method', 'Method\n方法・手順', c.green],
      ])
    case FrameworkType.QCD:
      return oneRow([
        ['quality', 'Quality\n品質・精度', c.green],
        ['cost', 'Cost\nコスト・工数', c.blue],
        ['delivery', 'Delivery\n納期・速度', c.orange],
      ])
    case FrameworkType.STP:
      return oneRow([
        ['segmentation', 'Segmentation\n市場細分化', c.purple],
        ['targeting', 'Targeting\nターゲット選定', c.blue],
        ['positioning', 'Positioning\n立ち位置・差別化', c.green],
      ])
    case FrameworkType.BSC:
      return grid2([
        ['bsc_financial', '財務\nROI・売上・利益', c.green],
        ['bsc_customer', '顧客\n満足度・NPS', c.blue],
        ['bsc_process', '内部プロセス\n業務効率', c.orange],
        ['bsc_learning', '学習と成長\n人材・イノベーション', c.purple],
      ])
    case FrameworkType.ABC:
      return oneRow([
        ['abc_high', 'A群\n重点管理', c.green],
        ['abc_mid', 'B群\n維持管理', c.yellow],
        ['abc_low', 'C群\n見直し', c.slate],
      ])
    case FrameworkType.RACI:
      return oneRow([
        ['raci_responsible', 'R\n実行責任者', c.red],
        ['raci_accountable', 'A\n説明責任者', c.orange],
        ['raci_consulted', 'C\n相談先', c.blue],
        ['raci_informed', 'I\n報告先', c.slate],
      ])
    case FrameworkType.YWT:
      return oneRow([
        ['did', 'Y\nやったこと', c.blue],
        ['learned', 'W\nわかったこと', c.green],
        ['next', 'T\n次にやること', c.orange],
      ])
    case FrameworkType.SPIN:
      return oneRow([
        ['spin_situation', 'Situation\n状況質問', c.purple],
        ['spin_problem', 'Problem\n問題質問', c.red],
        ['spin_implication', 'Implication\n示唆質問', c.orange],
        ['spin_need', 'Need-payoff\n解決質問', c.green],
      ])
    case FrameworkType.CUSTOMER_JOURNEY:
      return oneRow([
        ['cj_awareness', '認知\nAwareness', c.purple],
        ['cj_consideration', '検討\nConsideration', c.blue],
        ['cj_purchase', '購入\nPurchase', c.green],
        ['cj_retention', '継続\nRetention', c.orange],
        ['cj_advocacy', '推薦\nAdvocacy', c.pink],
      ])
    case FrameworkType.VSM:
      return oneRow([
        ['vsm_input', 'Input\n入力・受注', c.purple],
        ['vsm_value_add', '付加価値\n活動', c.green],
        ['vsm_non_value', '非付加価値\n無駄', c.red],
        ['vsm_output', 'Output\n出力・納品', c.blue],
        ['vsm_bottleneck', 'ボトルネック\n滞留・遅延', c.yellow],
      ])
    case FrameworkType.DMAIC:
      return oneRow([
        ['dmaic_define', 'Define\n問題定義', c.purple],
        ['dmaic_measure', 'Measure\n測定', c.blue],
        ['dmaic_analyze', 'Analyze\n分析', c.orange],
        ['dmaic_improve', 'Improve\n改善', c.green],
        ['dmaic_control', 'Control\n管理・定着', c.pink],
      ])
    default:
      return oneRow([['unclassified', '未分類', c.slate]])
  }
}

function oneRow(items: [NodeRole, string, string][]): MatrixConfig {
  return {
    rows: 1,
    cols: items.length,
    cells: [items.map(([role, label, color]) => ({ role, label, color }))],
  }
}

function grid2(items: [NodeRole, string, string][]): MatrixConfig {
  return {
    rows: 2,
    cols: 2,
    cells: [
      items.slice(0, 2).map(([role, label, color]) => ({ role, label, color })),
      items.slice(2, 4).map(([role, label, color]) => ({ role, label, color })),
    ],
  }
}
