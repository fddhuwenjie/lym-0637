import { useEffect, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import Table, { TableColumn } from '@/components/Table'
import Modal from '@/components/Modal'
import Badge from '@/components/Badge'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import {
  positionCertConfigApi,
  interventionRuleApi,
} from '@/api'
import type {
  PositionCertConfig,
  CertificateRiskLevel,
  InterventionActionType,
  InterventionTriggerType,
  InterventionRule,
} from '../../../shared/types'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const RISK_LEVEL_META: Record<
  CertificateRiskLevel,
  { label: string; variant: 'default' | 'warning' | 'danger' | 'success' }
> = {
  low: { label: '低风险', variant: 'success' },
  medium: { label: '中风险', variant: 'default' },
  high: { label: '高风险', variant: 'warning' },
  critical: { label: '极高风险', variant: 'danger' },
}

const TRIGGER_TYPE_META: Record<InterventionTriggerType, string> = {
  cert_expiring: '证书临期',
  cert_expired: '证书过期',
  exam_fail_repeated: '多次考试未通过',
  required_course_gap: '必修课程缺口',
  required_cert_gap: '必修证书缺口',
}

const ACTION_TYPE_META: Record<InterventionActionType, string> = {
  notify: '发送通知',
  assign_course: '分配课程',
  assign_exam: '分配考试',
  manual_review: '人工审核',
  schedule_review: '安排复核',
}

interface ConfigFormData {
  positionId: string
  reviewCycleDays: number
  riskLevel: CertificateRiskLevel
  ruleIds: string[]
  assignedReviewerIds: string[]
}

const initialFormData: ConfigFormData = {
  positionId: '',
  reviewCycleDays: 365,
  riskLevel: 'medium',
  ruleIds: [],
  assignedReviewerIds: [],
}

export default function PositionCertConfigPage() {
  const {
    positionCertConfigs,
    positions,
    interventionRules,
    users,
    loadPositionCertConfigs,
    loadPositions,
    loadInterventionRules,
    loadUsers,
  } = useDataStore()
  const { user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<PositionCertConfig | null>(null)
  const [formData, setFormData] = useState<ConfigFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [ruleTab, setRuleTab] = useState<'config' | 'rules'>('config')

  useEffect(() => {
    loadPositionCertConfigs()
    loadPositions()
    loadInterventionRules()
    loadUsers()
  }, [
    loadPositionCertConfigs,
    loadPositions,
    loadInterventionRules,
    loadUsers,
  ])

  const availablePositions = positions.filter(
    (p) =>
      !positionCertConfigs.some((c) => c.positionId === p.id) ||
      editingConfig?.positionId === p.id
  )

  const hrUsers = users.filter((u) => u.role === 'hr')

  const openCreateModal = () => {
    setEditingConfig(null)
    setFormData({
      ...initialFormData,
      assignedReviewerIds: user ? [user.id] : [],
    })
    setModalOpen(true)
  }

  const openEditModal = (config: PositionCertConfig) => {
    setEditingConfig(config)
    setFormData({
      positionId: config.positionId,
      reviewCycleDays: config.reviewCycleDays,
      riskLevel: config.riskLevel,
      ruleIds: [...config.ruleIds],
      assignedReviewerIds: [...config.assignedReviewerIds],
    })
    setModalOpen(true)
  }

  const toggleRule = (ruleId: string) => {
    setFormData({
      ...formData,
      ruleIds: formData.ruleIds.includes(ruleId)
        ? formData.ruleIds.filter((id) => id !== ruleId)
        : [...formData.ruleIds, ruleId],
    })
  }

  const toggleReviewer = (userId: string) => {
    setFormData({
      ...formData,
      assignedReviewerIds: formData.assignedReviewerIds.includes(userId)
        ? formData.assignedReviewerIds.filter((id) => id !== userId)
        : [...formData.assignedReviewerIds, userId],
    })
  }

  const handleSubmit = async () => {
    if (!formData.positionId) {
      alert('请选择岗位')
      return
    }
    if (formData.reviewCycleDays < 1) {
      alert('复核周期必须大于0天')
      return
    }
    setLoading(true)
    try {
      if (editingConfig) {
        const res = await positionCertConfigApi.updateConfig(
          editingConfig.id,
          formData
        )
        if (!res.success) {
          alert(res.error || '更新失败')
          return
        }
      } else {
        const res = await positionCertConfigApi.createConfig(formData)
        if (!res.success) {
          alert(res.error || '创建失败')
          return
        }
      }
      await loadPositionCertConfigs()
      setModalOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该配置吗？')) return
    const res = await positionCertConfigApi.deleteConfig(id)
    if (res.success) {
      await loadPositionCertConfigs()
    } else {
      alert(res.error || '删除失败')
    }
  }

  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<InterventionRule | null>(null)
  const [ruleFormData, setRuleFormData] = useState<{
    triggerType: InterventionTriggerType
    triggerValue: number | ''
    actions: InterventionActionType[]
    description: string
    enabled: boolean
    priority: number
  }>({
    triggerType: 'cert_expiring',
    triggerValue: 30,
    actions: [],
    description: '',
    enabled: true,
    priority: 1,
  })
  const [ruleSaving, setRuleSaving] = useState(false)

  const toggleRuleEnabled = async (rule: InterventionRule) => {
    const res = await interventionRuleApi.updateRule(rule.id, {
      enabled: !rule.enabled,
    })
    if (res.success) {
      await loadInterventionRules()
    } else {
      alert(res.error || '操作失败')
    }
  }

  const openCreateRuleModal = () => {
    setEditingRule(null)
    setRuleFormData({
      triggerType: 'cert_expiring',
      triggerValue: 30,
      actions: [],
      description: '',
      enabled: true,
      priority: 1,
    })
    setRuleModalOpen(true)
  }

  const openEditRuleModal = (rule: InterventionRule) => {
    setEditingRule(rule)
    setRuleFormData({
      triggerType: rule.triggerType,
      triggerValue: rule.triggerValue ?? '',
      actions: [...rule.actions],
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
    })
    setRuleModalOpen(true)
  }

  const toggleRuleAction = (action: InterventionActionType) => {
    setRuleFormData({
      ...ruleFormData,
      actions: ruleFormData.actions.includes(action)
        ? ruleFormData.actions.filter((a) => a !== action)
        : [...ruleFormData.actions, action],
    })
  }

  const handleRuleSubmit = async () => {
    if (!ruleFormData.triggerType) {
      alert('请选择触发条件')
      return
    }
    if (ruleFormData.actions.length === 0) {
      alert('请至少选择一个干预动作')
      return
    }
    if (!ruleFormData.description.trim()) {
      alert('请填写规则描述')
      return
    }
    setRuleSaving(true)
    try {
      const payload = {
        triggerType: ruleFormData.triggerType,
        triggerValue: ruleFormData.triggerValue === '' ? undefined : Number(ruleFormData.triggerValue),
        actions: ruleFormData.actions,
        description: ruleFormData.description.trim(),
        enabled: ruleFormData.enabled,
        priority: Number(ruleFormData.priority),
      }
      if (editingRule) {
        const res = await interventionRuleApi.updateRule(editingRule.id, payload)
        if (!res.success) {
          alert(res.error || '更新失败')
          return
        }
      } else {
        const res = await interventionRuleApi.createRule({
          triggerType: payload.triggerType,
          triggerValue: payload.triggerValue,
          actions: payload.actions,
          description: payload.description,
          enabled: payload.enabled,
          priority: payload.priority,
        })
        if (!res.success) {
          alert(res.error || '创建失败')
          return
        }
      }
      await loadInterventionRules()
      setRuleModalOpen(false)
    } finally {
      setRuleSaving(false)
    }
  }

  const handleDeleteRule = async (id: string) => {
    if (!confirm('确定要删除该规则吗？删除后将不可恢复。')) return
    const res = await interventionRuleApi.deleteRule(id)
    if (res.success) {
      await loadInterventionRules()
    } else {
      alert(res.error || '删除失败')
    }
  }

  const configColumns: TableColumn<PositionCertConfig>[] = [
    {
      key: 'positionName',
      title: '岗位名称',
      dataIndex: 'positionName',
      width: 140,
    },
    {
      key: 'reviewCycleDays',
      title: '复核周期(天)',
      dataIndex: 'reviewCycleDays',
      align: 'center',
      width: 120,
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      dataIndex: 'riskLevel',
      align: 'center',
      width: 120,
      render: (value) => {
        const meta = RISK_LEVEL_META[value as CertificateRiskLevel]
        return <Badge variant={meta.variant}>{meta.label}</Badge>
      },
    },
    {
      key: 'ruleCount',
      title: '启用规则数',
      dataIndex: 'ruleIds',
      align: 'center',
      width: 120,
      render: (value) => (
        <span className="font-medium text-slate-700">
          {(value as string[]).length} 条
        </span>
      ),
    },
    {
      key: 'reviewers',
      title: '复核负责人',
      dataIndex: 'assignedReviewerIds',
      render: (value) => {
        const ids = value as string[]
        const names = ids
          .map((id) => users.find((u) => u.id === id)?.name)
          .filter(Boolean)
        return (
          <span className="text-sm text-slate-600">
            {names.join('、') || '-'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      dataIndex: 'id',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openEditModal(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="编辑"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const ruleColumns: TableColumn<InterventionRule>[] = [
    {
      key: 'triggerType',
      title: '触发条件',
      dataIndex: 'triggerType',
      width: 140,
      render: (value) => (
        <span className="font-medium text-slate-700">
          {TRIGGER_TYPE_META[value as InterventionTriggerType]}
        </span>
      ),
    },
    {
      key: 'triggerValue',
      title: '阈值',
      dataIndex: 'triggerValue',
      align: 'center',
      width: 100,
      render: (value) => (
        <span className="text-slate-600">{value ?? '-'}</span>
      ),
    },
    {
      key: 'description',
      title: '规则描述',
      dataIndex: 'description',
    },
    {
      key: 'actions',
      title: '干预动作',
      dataIndex: 'actions',
      render: (value) => {
        const actions = value as InterventionActionType[]
        return (
          <div className="flex flex-wrap gap-1">
            {actions.map((a) => (
              <span
                key={a}
                className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
              >
                {ACTION_TYPE_META[a]}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'priority',
      title: '优先级',
      dataIndex: 'priority',
      align: 'center',
      width: 80,
      render: (value) => {
        const p = value as number
        return (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              p >= 3
                ? 'bg-red-100 text-red-700'
                : p === 2
                ? 'bg-amber-100 text-amber-700'
                : 'bg-sky-100 text-sky-700'
            )}
          >
            P{p}
          </span>
        )
      },
    },
    {
      key: 'enabled',
      title: '状态',
      dataIndex: 'enabled',
      align: 'center',
      width: 100,
      render: (value, record) => (
        <button
          onClick={() => toggleRuleEnabled(record)}
          className={cn(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
            value
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          )}
        >
          {value ? '已启用' : '已禁用'}
        </button>
      ),
    },
    {
      key: 'op',
      title: '操作',
      dataIndex: 'id',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => openEditRuleModal(record)}
            className="p-1.5 text-[#0ea5e9] hover:bg-sky-50 rounded transition-colors"
            title="编辑"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => handleDeleteRule(record.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            岗位证书复核配置
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setRuleTab('config')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  ruleTab === 'config'
                    ? 'bg-white text-[#1e3a5f] shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                )}
              >
                岗位配置
              </button>
              <button
                onClick={() => setRuleTab('rules')}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  ruleTab === 'rules'
                    ? 'bg-white text-[#1e3a5f] shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                )}
              >
                干预规则
              </button>
            </div>
            {ruleTab === 'config' ? (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm"
              >
                <Plus size={16} />
                新增配置
              </button>
            ) : (
              <button
                onClick={openCreateRuleModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#163049] transition-colors text-sm"
              >
                <Plus size={16} />
                新增规则
              </button>
            )}
          </div>
        </div>

        {ruleTab === 'config' ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-amber-600 mt-0.5 flex-shrink-0"
              />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">配置说明</p>
                <p className="text-amber-700">
                  人事可为每个岗位配置证书复核周期、风险等级和学习干预规则。系统将根据配置自动识别临期、过期、多次考试未通过及岗位必修缺口的员工，并生成干预任务。
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <Table columns={configColumns} data={positionCertConfigs} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <Table columns={ruleColumns} data={interventionRules} />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingConfig ? '编辑岗位复核配置' : '新增岗位复核配置'}
        onClose={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={loading ? '保存中...' : '保存'}
        width={640}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              岗位 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.positionId}
              onChange={(e) =>
                setFormData({ ...formData, positionId: e.target.value })
              }
              disabled={!!editingConfig}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent disabled:bg-slate-100"
            >
              <option value="">请选择岗位</option>
              {availablePositions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                复核周期(天) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={formData.reviewCycleDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reviewCycleDays: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                风险等级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.riskLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    riskLevel: e.target.value as CertificateRiskLevel,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              >
                {Object.entries(RISK_LEVEL_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              学习干预规则（多选）
            </label>
            <div className="border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {interventionRules.length === 0 ? (
                <p className="text-sm text-slate-400">暂无规则</p>
              ) : (
                interventionRules.map((rule) => (
                  <label
                    key={rule.id}
                    className={cn(
                      'flex items-start gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded',
                      !rule.enabled && 'opacity-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.ruleIds.includes(rule.id)}
                      onChange={() => toggleRule(rule.id)}
                      disabled={!rule.enabled}
                      className="w-4 h-4 mt-0.5 text-[#1e3a5f]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-slate-700">
                          {TRIGGER_TYPE_META[rule.triggerType]}
                        </span>
                        {rule.triggerValue && (
                          <span className="text-xs text-slate-500">
                            (阈值: {rule.triggerValue})
                          </span>
                        )}
                        {!rule.enabled && (
                          <span className="text-xs text-red-500">(已禁用)</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {rule.description}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              复核负责人（多选）
            </label>
            <div className="border border-slate-200 rounded-md p-3 max-h-32 overflow-y-auto space-y-1">
              {hrUsers.length === 0 ? (
                <p className="text-sm text-slate-400">暂无人事用户</p>
              ) : (
                hrUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedReviewerIds.includes(u.id)}
                      onChange={() => toggleReviewer(u.id)}
                      className="w-4 h-4 text-[#1e3a5f]"
                    />
                    <span className="text-sm">
                      {u.avatar} {u.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={ruleModalOpen}
        title={editingRule ? '编辑干预规则' : '新增干预规则'}
        onClose={() => setRuleModalOpen(false)}
        onOk={handleRuleSubmit}
        okText={ruleSaving ? '保存中...' : '保存'}
        width={600}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                触发条件 <span className="text-red-500">*</span>
              </label>
              <select
                value={ruleFormData.triggerType}
                onChange={(e) =>
                  setRuleFormData({
                    ...ruleFormData,
                    triggerType: e.target.value as InterventionTriggerType,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              >
                {Object.entries(TRIGGER_TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                阈值（天数/次数）
              </label>
              <input
                type="number"
                min={0}
                value={ruleFormData.triggerValue}
                onChange={(e) =>
                  setRuleFormData({
                    ...ruleFormData,
                    triggerValue: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
                placeholder="如：30天、2次"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                优先级 <span className="text-red-500">*</span>
              </label>
              <select
                value={ruleFormData.priority}
                onChange={(e) =>
                  setRuleFormData({
                    ...ruleFormData,
                    priority: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent"
              >
                <option value={1}>P1 - 低</option>
                <option value={2}>P2 - 中</option>
                <option value={3}>P3 - 高</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                状态
              </label>
              <div className="flex items-center h-[38px]">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleFormData.enabled}
                    onChange={(e) =>
                      setRuleFormData({
                        ...ruleFormData,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#1e3a5f]"
                  />
                  <span className="ml-2 text-sm text-slate-700">
                    {ruleFormData.enabled ? '启用' : '禁用'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              干预动作（多选） <span className="text-red-500">*</span>
            </label>
            <div className="border border-slate-200 rounded-md p-3 space-y-2">
              {Object.entries(ACTION_TYPE_META).map(([k, v]) => (
                <label
                  key={k}
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={ruleFormData.actions.includes(k as InterventionActionType)}
                    onChange={() => toggleRuleAction(k as InterventionActionType)}
                    className="w-4 h-4 text-[#1e3a5f]"
                  />
                  <span className="text-sm">{v}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              规则描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={ruleFormData.description}
              onChange={(e) =>
                setRuleFormData({
                  ...ruleFormData,
                  description: e.target.value,
                })
              }
              rows={3}
              placeholder="请详细描述该规则的触发条件和处理方式..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent resize-none"
            />
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
