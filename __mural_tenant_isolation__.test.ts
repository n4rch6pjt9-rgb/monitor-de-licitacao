import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  statusCatalogRepository,
  STATUS_FAMILIES,
} from './server/lib/statusCatalog.js';
import {
  getMuralProcessDetail,
  listMuralCards,
  registerMuralProcess,
} from './server/lib/muralData.js';

test('Tenant Isolation 1: Mural processes are strictly isolated per tenant (IDOR protection)', async () => {
  const TENANT_A = 101;
  const TENANT_B = 202;

  // 1. Ingest process for Tenant A
  const processA = await registerMuralProcess(
    {
      'CÓDIGO': '9001',
      'Chamamento público': '0009001-1/2026',
      'PROCESSO': 'DEPARTAMENTO REGIONAL A',
      'Linha de fornecimento': 'Fornecimento de esteiras e bicicletas ergonômicas para academia',
      'Edital': 'Pregão Eletrônico',
      'UNIDADE COMPRADORA': '01/09/2026 09:00',
      'OBJETO': '15/09/2026 18:00',
      'Início das inscrições': '01/09/2026 08:00',
      'SITUAÇÃO': 'HOMOLOGADO',
    },
    'PregaoEletronico',
    TENANT_A
  );

  // 2. Ingest process for Tenant B
  const processB = await registerMuralProcess(
    {
      'CÓDIGO': '9002',
      'Chamamento público': '0009002-2/2026',
      'PROCESSO': 'DEPARTAMENTO REGIONAL B',
      'Linha de fornecimento': 'Serviços de manutenção predial especializada',
      'Edital': 'Pregão Eletrônico',
      'UNIDADE COMPRADORA': '05/09/2026 10:00',
      'OBJETO': '20/09/2026 17:00',
      'Início das inscrições': '05/09/2026 08:00',
      'SITUAÇÃO': 'HOMOLOGADO',
    },
    'PregaoEletronico',
    TENANT_B
  );

  assert.ok(processA.card);
  assert.ok(processB.card);

  // 3. Verify Tenant A lists only Tenant A cards
  const cardsA = await listMuralCards(TENANT_A);
  const codesA = cardsA.map((c) => c.codigo);
  assert.ok(codesA.includes('9001'), 'Tenant A deve listar seu próprio processo 9001');
  assert.ok(!codesA.includes('9002'), 'Tenant A JAMAIS deve ver processo 9002 do Tenant B');

  // 4. Verify Tenant B lists only Tenant B cards
  const cardsB = await listMuralCards(TENANT_B);
  const codesB = cardsB.map((c) => c.codigo);
  assert.ok(codesB.includes('9002'), 'Tenant B deve listar seu próprio processo 9002');
  assert.ok(!codesB.includes('9001'), 'Tenant B JAMAIS deve ver processo 9001 do Tenant A');

  // 5. Cross-tenant Detail read attempt (IDOR attack simulation)
  // Tenant A reads process 9001 -> success
  const detailA = await getMuralProcessDetail('9001', TENANT_A);
  assert.ok(detailA);
  assert.equal(detailA.resumo.codigo, '9001');

  // Tenant B attempts to read process 9001 -> MUST RETURN NULL (404)
  const idorAttemptB = await getMuralProcessDetail('9001', TENANT_B);
  assert.equal(idorAttemptB, null, 'IDOR Bloqueado: Tenant B não pode ler processo do Tenant A');

  // Tenant A attempts to read process 9002 -> MUST RETURN NULL (404)
  const idorAttemptA = await getMuralProcessDetail('9002', TENANT_A);
  assert.equal(idorAttemptA, null, 'IDOR Bloqueado: Tenant A não pode ler processo do Tenant B');

  // 6. Golden process (76) belongs to primary tenant (1)
  const detail76Tenant1 = await getMuralProcessDetail('76', 1);
  assert.ok(detail76Tenant1, 'Tenant 1 tem acesso ao golden process 76');

  const detail76TenantB = await getMuralProcessDetail('76', TENANT_B);
  assert.equal(detail76TenantB, null, 'Tenant B isolado não deve ver processo 76 do Tenant 1');
});

test('Tenant Isolation 2: Status Catalog CRUD is strictly tenant-scoped (IDOR & mutation protection)', async () => {
  const TENANT_A = 301;
  const TENANT_B = 402;

  // 1. Both tenants have access to their catalog
  const catalogA = await statusCatalogRepository.getAll(TENANT_A);
  const catalogB = await statusCatalogRepository.getAll(TENANT_B);
  assert.ok(catalogA.length >= 91, 'Tenant A possui catálogo inicial');
  assert.ok(catalogB.length >= 91, 'Tenant B possui catálogo inicial');

  // 2. Admin of Tenant A creates a custom status for Tenant A
  const customStatusA = await statusCatalogRepository.create({
    tenantId: TENANT_A,
    family: 'CotacaoDeOrcamento',
    code: 'CUSTOM_STATUS_TENANT_A',
    label: 'Status Customizado da Empresa A',
    description: 'Privado para o tenant A',
  });

  assert.ok(customStatusA.id);
  assert.equal(customStatusA.tenantId, TENANT_A);

  // 3. Tenant A can find it by ID
  const foundA = await statusCatalogRepository.getById(customStatusA.id!, TENANT_A);
  assert.ok(foundA);
  assert.equal(foundA.code, 'CUSTOM_STATUS_TENANT_A');

  // 4. Tenant B tries to read Tenant A's status by ID -> MUST RETURN NULL (404 IDOR protection)
  const idorReadB = await statusCatalogRepository.getById(customStatusA.id!, TENANT_B);
  assert.equal(idorReadB, null, 'IDOR Bloqueado: Tenant B não pode obter status do Tenant A por ID');

  // 5. Tenant B lists all statuses -> does NOT contain Tenant A's custom status
  const listB = await statusCatalogRepository.getAll(TENANT_B);
  const foundInListB = listB.find((item) => item.code === 'CUSTOM_STATUS_TENANT_A');
  assert.equal(foundInListB, undefined, 'Tenant B não pode ver status do Tenant A na listagem');

  // 6. Tenant B tries to MUTATE Tenant A's status -> MUST RETURN NULL (404 IDOR mutation blocked)
  const idorUpdateAttempt = await statusCatalogRepository.update(
    customStatusA.id!,
    TENANT_B,
    { label: 'Tentativa Maliciosa de Alteração' }
  );
  assert.equal(idorUpdateAttempt, null, 'IDOR Bloqueado: Tenant B não pode alterar status do Tenant A');

  // Verify status in Tenant A is unchanged
  const verifiedA = await statusCatalogRepository.getById(customStatusA.id!, TENANT_A);
  assert.equal(verifiedA?.label, 'Status Customizado da Empresa A');

  // 7. Tenant B tries to DEACTIVATE Tenant A's status -> MUST RETURN NULL (404 IDOR mutation blocked)
  const idorDeactivateAttempt = await statusCatalogRepository.deactivate(
    customStatusA.id!,
    TENANT_B
  );
  assert.equal(idorDeactivateAttempt, null, 'IDOR Bloqueado: Tenant B não pode desativar status do Tenant A');

  const verifiedActiveA = await statusCatalogRepository.getById(customStatusA.id!, TENANT_A);
  assert.equal(verifiedActiveA?.active, true, 'Status do Tenant A continua ativo');

  // 8. Tenant A successfully mutates their own status
  const validUpdateA = await statusCatalogRepository.update(
    customStatusA.id!,
    TENANT_A,
    { label: 'Label Atualizado por Admin Tenant A' }
  );
  assert.equal(validUpdateA?.label, 'Label Atualizado por Admin Tenant A');

  // 9. Tenant A successfully deactivates their own status
  const validDeactivateA = await statusCatalogRepository.deactivate(
    customStatusA.id!,
    TENANT_A
  );
  assert.equal(validDeactivateA?.active, false);
});

test('Tenant Isolation 3: Fail-closed behavior on missing tenant or unknown status per tenant', async () => {
  const TENANT_A = 501;

  // 1. Validation fails for unknown status within family (fail-closed)
  const failUnknown = await statusCatalogRepository.validateStatusOnWrite(
    'PregaoEletronico',
    'STATUS_INVENTADO_FAKE',
    TENANT_A
  );
  assert.equal(failUnknown.valid, false);
  assert.ok(failUnknown.error?.includes('fail-closed'));

  // 2. Validation fails for invalid family
  const failFamily = await statusCatalogRepository.validateStatusOnWrite(
    'FamiliaInexistente',
    'HOMOLOGADO',
    TENANT_A
  );
  assert.equal(failFamily.valid, false);
  assert.ok(failFamily.error?.includes('Família inválida'));

  // 3. Validation succeeds for valid catalogued status in this tenant
  const validCheck = await statusCatalogRepository.validateStatusOnWrite(
    'PregaoEletronico',
    'HOMOLOGADO',
    TENANT_A
  );
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.status?.code, 'HOMOLOGADO');
});

test('Tenant Isolation 4: Auth middleware enforces fail-closed tenantId and rejects query/body spoofing', async () => {
  const { getAuthenticatedTenantId, validateTenantBodyMatch } = await import('./server/lib/tenantAuth.js');

  function createMockRes() {
    const res: any = {
      statusCode: 200,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      },
    };
    return res;
  }

  // 1. Valid authenticated tenant from JWT / API-key
  const reqValid: any = {
    user: { tenantId: 42, role: 'admin' },
    query: { tenantId: '999' }, // Malicious query injection attempt
    body: { tenantId: 999 }, // Malicious body injection attempt
  };
  const resValid = createMockRes();
  const resolvedTenantId = getAuthenticatedTenantId(reqValid, resValid);
  assert.equal(resolvedTenantId, 42, 'Deve extrair ESTRITAMENTE req.user.tenantId, ignorando query');

  // 2. Body spoofing validation rejects mismatched tenantId
  const resSpoof = createMockRes();
  const isMatchValid = validateTenantBodyMatch(reqValid, resSpoof, resolvedTenantId!);
  assert.equal(isMatchValid, false, 'Deve rejeitar tentativa de forjar tenantId diferente no body');
  assert.equal(resSpoof.statusCode, 400);
  assert.ok(resSpoof.body?.error?.includes('IDOR Protection'));

  // 3. Fail-closed: unauthenticated request (no user object)
  const reqUnauth: any = {};
  const resUnauth = createMockRes();
  const resolvedUnauth = getAuthenticatedTenantId(reqUnauth, resUnauth);
  assert.equal(resolvedUnauth, null, 'Deve retornar null para requisição não autenticada');
  assert.equal(resUnauth.statusCode, 401);
  assert.ok(resUnauth.body?.error?.includes('fail-closed'));

  // 4. Fail-closed: user object without valid numeric tenantId
  const reqInvalidTenant: any = { user: { tenantId: 'invalid-string' } };
  const resInvalidTenant = createMockRes();
  const resolvedInvalid = getAuthenticatedTenantId(reqInvalidTenant, resInvalidTenant);
  assert.equal(resolvedInvalid, null);
  assert.equal(resInvalidTenant.statusCode, 401);
});

test('Tenant Isolation 5: Status catalog mutation requires admin role check (POST/PUT/DELETE)', async () => {
  const { requireAdminRole } = await import('./server/lib/tenantAuth.js');

  function createMockRes() {
    const res: any = {
      statusCode: 200,
      body: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.body = data;
        return this;
      },
    };
    return res;
  }

  // 1. Admin user is allowed (next() called)
  let adminNextCalled = false;
  const reqAdmin: any = { user: { tenantId: 10, role: 'admin' } };
  const resAdmin = createMockRes();
  requireAdminRole(reqAdmin, resAdmin, () => {
    adminNextCalled = true;
  });
  assert.equal(adminNextCalled, true, 'Admin deve ser autorizado para mutações de catálogo');

  // 2. Regular user (role: 'user') is rejected with 403 Forbidden
  let regularNextCalled = false;
  const reqRegular: any = { user: { tenantId: 10, role: 'user' } };
  const resRegular = createMockRes();
  requireAdminRole(reqRegular, resRegular, () => {
    regularNextCalled = true;
  });
  assert.equal(regularNextCalled, false, 'Usuário comum NÃO pode mutar catálogo');
  assert.equal(resRegular.statusCode, 403);
  assert.ok(resRegular.body?.error?.includes('Forbidden'));

  // 3. User with missing role is rejected with 403 Forbidden
  let noRoleNextCalled = false;
  const reqNoRole: any = { user: { tenantId: 10 } };
  const resNoRole = createMockRes();
  requireAdminRole(reqNoRole, resNoRole, () => {
    noRoleNextCalled = true;
  });
  assert.equal(noRoleNextCalled, false);
  assert.equal(resNoRole.statusCode, 403);

  // 4. Unauthenticated is rejected with 401
  const reqUnauth: any = {};
  const resUnauth = createMockRes();
  let unauthNextCalled = false;
  requireAdminRole(reqUnauth, resUnauth, () => {
    unauthNextCalled = true;
  });
  assert.equal(unauthNextCalled, false);
  assert.equal(resUnauth.statusCode, 401);
});

