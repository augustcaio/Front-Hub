# Devices App

App Django para gerenciamento de dispositivos IoT/sensores.

## Modelo Device

O modelo `Device` representa dispositivos IoT ou sensores no sistema.

### Campos Principais:

- **id**: Primary key auto-gerado (BigAutoField)
- **public_id**: Identificador público único (UUIDField) - **Não sequencial e seguro**
- **name**: Nome do dispositivo (CharField, max_length=255)
- **status**: Status do dispositivo (CharField com choices):
  - `active`: Ativo
  - `inactive`: Inativo (padrão)
  - `maintenance`: Em manutenção
  - `error`: Com erro
- **description**: Descrição opcional do dispositivo (TextField)
- **created_at**: Data de criação (DateTimeField, auto_now_add)
- **updated_at**: Data da última atualização (DateTimeField, auto_now)

### Recursos:

- ✅ **UUIDField para `public_id`**: Identificadores únicos não sequenciais (conforme boas práticas)
- ✅ Índices no banco de dados (public_id, status, created_at)
- ✅ Type hints aplicados nos métodos
- ✅ Tradução (i18n) configurada
- ✅ Status com choices (TextChoices)
- ✅ Timestamps automáticos

### Por que UUIDField para public_id?

Conforme as boas práticas definidas, o `public_id` usa `UUIDField` porque:
1. **Não sequencial**: Evita expor informações sobre quantidade de dispositivos
2. **Seguro**: Dificulta enumeração de IDs
3. **Único globalmente**: Evita colisões
4. **Público**: Pode ser usado em APIs sem expor o ID interno

## Migrações

Para aplicar as migrações:

```bash
# Via Docker (recomendado)
docker-compose exec backend python manage.py migrate

# Ou localmente (se tiver ambiente configurado)
python manage.py migrate
```

## Admin

O modelo está registrado no Django Admin com:
- Listagem por: public_id, name, status, created_at, updated_at
- Filtros por: status, created_at
- Busca por: name, public_id
- Campos readonly: public_id, id, created_at, updated_at

---

## Modelo Measurement

O modelo `Measurement` representa dados de precisão coletados dos dispositivos.

### Campos Principais:

- **id**: Primary key auto-gerado (BigAutoField)
- **device**: ForeignKey para Device (relacionamento CASCADE)
- **metric**: Tipo de métrica/medição (CharField, max_length=100)
- **value**: Valor da medição (DecimalField com 20 dígitos, 10 casas decimais para precisão)
- **unit**: Unidade de medida (CharField, max_length=50)
- **timestamp**: Data/hora da medição (DateTimeField)

### Recursos:

- ✅ **ForeignKey** com `related_name='measurements'` para acesso reverso
- ✅ **DecimalField** para precisão nos valores (20 dígitos, 10 decimais)
- ✅ Índices compostos para otimização de queries:
  - `device + timestamp` (buscar medições por dispositivo e período)
  - `device + metric` (buscar medições por dispositivo e tipo de métrica)
  - `metric` (filtrar por tipo de métrica)
  - `timestamp` (filtrar por data)
- ✅ CASCADE on delete (se dispositivo for deletado, medições também serão)
- ✅ Type hints aplicados
- ✅ Otimização no Admin (select_related para evitar N+1)

### Relacionamento:

```python
Device (1) ──→ (N) Measurement
```

Um dispositivo pode ter múltiplas medições, mas cada medição pertence a um único dispositivo.

---

## Próximos Passos

- Implementar Serializers para a API REST
- Implementar ViewSets/Views para CRUD (Device e Measurement)
- Criar endpoint de ingestão de medições (POST /api/devices/{device_id}/measurements/)
- Implementar Custom Managers para consultas complexas/agregadas
- Adicionar relacionamento com User (se necessário)

