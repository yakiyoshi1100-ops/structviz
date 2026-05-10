import { FrameworkType, type NodeRole } from '@/types'

export interface MatrixConfig {
  cells: {
    role: NodeRole
    label: string
    color: string
  }[][]
  rows: number
  cols: number
}

export function getMatrixConfig(framework: FrameworkType): MatrixConfig {
  if (framework === FrameworkType.CROSS_SWOT) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'so_strategy', label: 'SO戦略\n強み×機会', color: '#22c55e' },
          { role: 'wo_strategy', label: 'WO戦略\n弱み×機会', color: '#3b82f6' },
        ],
        [
          { role: 'st_strategy', label: 'ST戦略\n強み×脅威', color: '#f97316' },
          { role: 'wt_strategy', label: 'WT戦略\n弱み×脅威', color: '#ef4444' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.PRIORITY_MATRIX) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'high_impact_easy', label: '最優先\n効果大×簡単', color: '#22c55e' },
          { role: 'high_impact_hard', label: '中長期\n効果大×難しい', color: '#3b82f6' },
        ],
        [
          { role: 'low_impact_easy', label: '余力で\n効果小×簡単', color: '#f97316' },
          { role: 'low_impact_hard', label: 'やらない\n効果小×難しい', color: '#ef4444' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.AS_IS_TO_BE) {
    return {
      rows: 1,
      cols: 4,
      cells: [
        [
          { role: 'as_is', label: 'As-Is\n現状', color: '#94a3b8' },
          { role: 'gap', label: 'Gap\n差分', color: '#f97316' },
          { role: 'to_be', label: 'To-Be\n理想', color: '#22c55e' },
          { role: 'action', label: 'Action\n打ち手', color: '#3b82f6' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.BUSINESS_FLOW) {
    return {
      rows: 1,
      cols: 6,
      cells: [
        [
          { role: 'flow_input', label: '入力\n受付・依頼', color: '#6366f1' },
          { role: 'flow_process', label: '処理\n作業・計算', color: '#3b82f6' },
          { role: 'flow_decision', label: '判断\n承認・決裁', color: '#f97316' },
          { role: 'flow_output', label: '出力\n作成・発行', color: '#22c55e' },
          { role: 'flow_storage', label: '保管\n保存・記録', color: '#94a3b8' },
          { role: 'flow_share', label: '共有\n報告・連絡', color: '#ec4899' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.ECRS) {
    return {
      rows: 1,
      cols: 4,
      cells: [
        [
          { role: 'eliminate', label: 'Eliminate\nなくせないか', color: '#ef4444' },
          { role: 'combine', label: 'Combine\nまとめられないか', color: '#f97316' },
          { role: 'rearrange', label: 'Rearrange\n順番変えられないか', color: '#3b82f6' },
          { role: 'simplify', label: 'Simplify\n簡単にできないか', color: '#22c55e' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.FOUR_M) {
    return {
      rows: 1,
      cols: 4,
      cells: [
        [
          { role: 'man', label: 'Man\n人・スキル', color: '#6366f1' },
          { role: 'machine', label: 'Machine\n設備・ツール', color: '#3b82f6' },
          { role: 'material', label: 'Material\n情報・データ', color: '#f97316' },
          { role: 'method', label: 'Method\n方法・手順', color: '#22c55e' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.QCD) {
    return {
      rows: 1,
      cols: 3,
      cells: [
        [
          { role: 'quality', label: 'Quality\n品質・精度', color: '#22c55e' },
          { role: 'cost', label: 'Cost\nコスト・工数', color: '#3b82f6' },
          { role: 'delivery', label: 'Delivery\n納期・速度', color: '#f97316' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.STP) {
    return {
      rows: 1,
      cols: 3,
      cells: [
        [
          { role: 'segmentation', label: 'Segmentation\n市場細分化', color: '#6366f1' },
          { role: 'targeting', label: 'Targeting\nターゲット選定', color: '#3b82f6' },
          { role: 'positioning', label: 'Positioning\n立ち位置・差別化', color: '#22c55e' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.PPM) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'star', label: '花形\n高成長×高シェア', color: '#f59e0b' },
          { role: 'question_mark', label: '問題児\n高成長×低シェア', color: '#3b82f6' },
        ],
        [
          { role: 'cash_cow', label: '金のなる木\n低成長×高シェア', color: '#22c55e' },
          { role: 'dog', label: '負け犬\n低成長×低シェア', color: '#94a3b8' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.BSC) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'bsc_financial', label: '財務\nROI・売上・利益', color: '#22c55e' },
          { role: 'bsc_customer', label: '顧客\n満足度・NPS', color: '#3b82f6' },
        ],
        [
          { role: 'bsc_process', label: '内部プロセス\n業務効率', color: '#f97316' },
          { role: 'bsc_learning', label: '学習と成長\n人材・イノベーション', color: '#6366f1' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.ABC) {
    return {
      rows: 1,
      cols: 3,
      cells: [
        [
          { role: 'abc_high', label: 'A群\n重点管理', color: '#22c55e' },
          { role: 'abc_mid', label: 'B群\n維持管理', color: '#f59e0b' },
          { role: 'abc_low', label: 'C群\n見直し', color: '#94a3b8' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.RACI) {
    return {
      rows: 1,
      cols: 4,
      cells: [
        [
          { role: 'raci_responsible', label: 'R\n実行責任者', color: '#ef4444' },
          { role: 'raci_accountable', label: 'A\n説明責任者', color: '#f97316' },
          { role: 'raci_consulted', label: 'C\n相談先', color: '#3b82f6' },
          { role: 'raci_informed', label: 'I\n報告先', color: '#94a3b8' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.YWT) {
    return {
      rows: 1,
      cols: 3,
      cells: [
        [
          { role: 'did', label: 'Y\nやったこと', color: '#3b82f6' },
          { role: 'learned', label: 'W\nわかったこと', color: '#22c55e' },
          { role: 'next', label: 'T\n次にやること', color: '#f97316' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.SPIN) {
    return {
      rows: 1,
      cols: 4,
      cells: [
        [
          { role: 'spin_situation', label: 'Situation\n状況質問', color: '#6366f1' },
          { role: 'spin_problem', label: 'Problem\n問題質問', color: '#ef4444' },
          { role: 'spin_implication', label: 'Implication\n示唆質問', color: '#f97316' },
          { role: 'spin_need', label: 'Need-payoff\n解決質問', color: '#22c55e' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.CUSTOMER_JOURNEY) {
    return {
      rows: 1,
      cols: 5,
      cells: [
        [
          { role: 'cj_awareness', label: '認知\nAwareness', color: '#6366f1' },
          { role: 'cj_consideration', label: '検討\nConsideration', color: '#3b82f6' },
          { role: 'cj_purchase', label: '購入\nPurchase', color: '#22c55e' },
          { role: 'cj_retention', label: '継続\nRetention', color: '#f97316' },
          { role: 'cj_advocacy', label: '推薦\nAdvocacy', color: '#ec4899' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.VSM) {
    return {
      rows: 1,
      cols: 5,
      cells: [
        [
          { role: 'vsm_input', label: 'Input\n入力・受注', color: '#6366f1' },
          { role: 'vsm_value_add', label: '付加価値\n活動', color: '#22c55e' },
          { role: 'vsm_non_value', label: '非付加価値\n無駄', color: '#ef4444' },
          { role: 'vsm_output', label: 'Output\n出力・納品', color: '#3b82f6' },
          { role: 'vsm_bottleneck', label: 'ボトルネック\n滞留・遅延', color: '#f59e0b' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.DMAIC) {
    return {
      rows: 1,
      cols: 5,
      cells: [
        [
          { role: 'dmaic_define', label: 'Define\n問題定義', color: '#6366f1' },
          { role: 'dmaic_measure', label: 'Measure\n測定', color: '#3b82f6' },
          { role: 'dmaic_analyze', label: 'Analyze\n分析', color: '#f97316' },
          { role: 'dmaic_improve', label: 'Improve\n改善', color: '#22c55e' },
          { role: 'dmaic_control', label: 'Control\n管理・定着', color: '#ec4899' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.THREE_C) {
    return {
      rows: 1,
      cols: 3,
      cells: [
        [
          { role: 'customer', label: 'Customer', color: '#e0f2fe' },
          { role: 'competitor', label: 'Competitor', color: '#fee2e2' },
          { role: 'company', label: 'Company', color: '#dcfce7' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.PEST) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'political', label: 'Politics', color: '#dbeafe' },
          { role: 'economic', label: 'Economy', color: '#dcfce7' },
        ],
        [
          { role: 'social', label: 'Society', color: '#fef3c7' },
          { role: 'technological', label: 'Technology', color: '#ede9fe' },
        ],
      ],
    }
  }

  if (framework === FrameworkType.ANSOFF) {
    return {
      rows: 2,
      cols: 2,
      cells: [
        [
          { role: 'market-penetration', label: '市場浸透', color: '#dbeafe' },
          { role: 'product-development', label: '新製品開発', color: '#dcfce7' },
        ],
        [
          { role: 'market-development', label: '市場開拓', color: '#fef3c7' },
          { role: 'diversification', label: '多角化', color: '#fee2e2' },
        ],
      ],
    }
  }

  return {
    rows: 2,
    cols: 2,
    cells: [
      [
        { role: 'strength', label: '強み', color: '#dbeafe' },
        { role: 'opportunity', label: '機会', color: '#dcfce7' },
      ],
      [
        { role: 'weakness', label: '弱み', color: '#fef3c7' },
        { role: 'threat', label: '脅威', color: '#fee2e2' },
      ],
    ],
  }
}
