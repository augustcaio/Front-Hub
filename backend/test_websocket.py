"""
Script de teste manual para WebSocket (Tarefa 2.4).

Este script testa o fluxo completo de WebSocket:
1. Conecta ao WebSocket usando public_id de um dispositivo
2. Escuta mensagens em tempo real
3. Pode ser usado em paralelo com envio de medições via API REST

Uso:
    python test_websocket.py

Requisitos:
    pip install websockets requests
"""
import asyncio
import json
import sys
import requests
from websockets.client import connect
from typing import Optional

# Configuração
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin123"  # Ajuste conforme necessário


def get_access_token() -> Optional[str]:
    """Obter token JWT para autenticação."""
    try:
        response = requests.post(
            f"{BASE_URL}/api/token/",
            json={"username": USERNAME, "password": PASSWORD}
        )
        response.raise_for_status()
        return response.json()["access"]
    except Exception as e:
        print(f"❌ Erro ao obter token: {e}")
        return None


def get_devices(token: str) -> list:
    """Obter lista de dispositivos."""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/devices/", headers=headers)
        response.raise_for_status()
        data = response.json()
        # DRF pode retornar paginação com 'results'
        devices = data.get("results", data) if isinstance(data, dict) else data
        return devices if isinstance(devices, list) else []
    except Exception as e:
        print(f"❌ Erro ao obter dispositivos: {e}")
        return []


def send_test_measurement(token: str, device_id: int, metric: str = "temperature", value: float = 25.5):
    """Enviar uma medição de teste via API REST."""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data = {
            "metric": metric,
            "value": str(value),
            "unit": "°C",
            "timestamp": "2024-01-01T12:00:00Z"
        }
        response = requests.post(
            f"{BASE_URL}/api/devices/{device_id}/measurements/",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        print(f"✅ Medição enviada: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"❌ Erro ao enviar medição: {e}")
        if hasattr(e, 'response'):
            print(f"   Resposta: {e.response.text}")
        return None


async def test_websocket_connection(public_id: str):
    """
    Testar conexão WebSocket e escutar mensagens.
    
    Args:
        public_id: UUID do dispositivo (public_id)
    """
    ws_url = f"{WS_URL}/ws/device/{public_id}/"
    print(f"\n🔌 Conectando ao WebSocket: {ws_url}")
    
    try:
        async with connect(ws_url) as websocket:
            print("✅ Conectado ao WebSocket!")
            
            # Esperar mensagem de boas-vindas
            try:
                welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                welcome_data = json.loads(welcome_msg)
                print(f"\n📨 Mensagem de boas-vindas recebida:")
                print(json.dumps(welcome_data, indent=2, ensure_ascii=False))
                
                if welcome_data.get("type") == "connection_established":
                    print(f"   ✅ Dispositivo: {welcome_data.get('device_name')}")
            except asyncio.TimeoutError:
                print("⚠️  Timeout aguardando mensagem de boas-vindas")
            
            print("\n👂 Escutando mensagens em tempo real...")
            print("   (Pressione Ctrl+C para sair ou envie uma medição via API)\n")
            
            # Escutar mensagens indefinidamente
            try:
                async for message in websocket:
                    data = json.loads(message)
                    print(f"📨 Mensagem recebida:")
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                    
                    if data.get("type") == "measurement_update":
                        measurement = data.get("measurement", {})
                        print(f"\n   ✅ Atualização de medição recebida em tempo real!")
                        print(f"   📊 Métrica: {measurement.get('metric')}")
                        print(f"   📈 Valor: {measurement.get('value')} {measurement.get('unit')}")
                        print()
            except KeyboardInterrupt:
                print("\n\n👋 Conexão WebSocket encerrada pelo usuário")
                
    except Exception as e:
        print(f"❌ Erro na conexão WebSocket: {e}")
        print(f"   Verifique se:")
        print(f"   - O servidor está rodando")
        print(f"   - O public_id está correto: {public_id}")
        print(f"   - O servidor está usando Daphne ou suporta WebSockets")


def main():
    """Função principal do teste."""
    print("=" * 60)
    print("🧪 TESTE MANUAL DE WEBSOCKET - Tarefa 2.4")
    print("=" * 60)
    
    # 1. Obter token
    print("\n1️⃣  Obtendo token de autenticação...")
    token = get_access_token()
    if not token:
        print("❌ Falha ao obter token. Encerrando.")
        sys.exit(1)
    print("✅ Token obtido com sucesso")
    
    # 2. Obter dispositivos
    print("\n2️⃣  Obtendo lista de dispositivos...")
    devices = get_devices(token)
    if not devices:
        print("❌ Nenhum dispositivo encontrado.")
        print("\n📝 Para criar um dispositivo de teste:")
        print("   1. Acesse o Django Admin: http://localhost:8000/admin/")
        print("   2. Crie um novo Device")
        print("   OU")
        print("   3. Use o Django shell:")
        print("      python manage.py shell")
        print("      >>> from devices.models import Device")
        print("      >>> Device.objects.create(name='Sensor Teste', status='active')")
        print("\n   Após criar, execute este script novamente.")
        sys.exit(1)
    
    print(f"✅ {len(devices)} dispositivo(s) encontrado(s):")
    for i, device in enumerate(devices, 1):
        print(f"   {i}. {device.get('name')} (ID: {device.get('id')}, public_id: {device.get('public_id')})")
    
    # 3. Selecionar dispositivo
    if len(devices) == 1:
        selected_device = devices[0]
        print(f"\n✅ Usando dispositivo: {selected_device.get('name')}")
    else:
        try:
            choice = input(f"\n3️⃣  Selecione um dispositivo (1-{len(devices)}): ")
            idx = int(choice) - 1
            if 0 <= idx < len(devices):
                selected_device = devices[idx]
            else:
                print("❌ Escolha inválida. Usando o primeiro dispositivo.")
                selected_device = devices[0]
        except (ValueError, KeyboardInterrupt):
            print("\n❌ Entrada inválida. Usando o primeiro dispositivo.")
            selected_device = devices[0]
    
    public_id = selected_device.get('public_id')
    device_id = selected_device.get('id')
    
    print(f"\n📋 Dispositivo selecionado:")
    print(f"   Nome: {selected_device.get('name')}")
    print(f"   ID: {device_id}")
    print(f"   Public ID: {public_id}")
    
    # 4. Instruções
    print("\n" + "=" * 60)
    print("📝 INSTRUÇÕES:")
    print("=" * 60)
    print("1. O WebSocket será conectado e ficará escutando mensagens")
    print("2. Em outro terminal, envie uma medição usando:")
    print(f"   python test_websocket.py --send-measurement {device_id}")
    print("   ou use a API REST:")
    print(f"   POST {BASE_URL}/api/devices/{device_id}/measurements/")
    print("3. A mensagem deve chegar em tempo real no WebSocket")
    print("4. Pressione Ctrl+C para sair")
    print("=" * 60 + "\n")
    
    # 5. Testar WebSocket
    try:
        asyncio.run(test_websocket_connection(public_id))
    except KeyboardInterrupt:
        print("\n\n✅ Teste encerrado pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro durante o teste: {e}")
        sys.exit(1)


def send_measurement_cli():
    """CLI para enviar medição de teste."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Enviar medição de teste")
    parser.add_argument("--send-measurement", type=int, metavar="DEVICE_ID",
                       help="Enviar medição de teste para o dispositivo")
    parser.add_argument("--metric", default="temperature", help="Nome da métrica")
    parser.add_argument("--value", type=float, default=25.5, help="Valor da medição")
    
    args = parser.parse_args()
    
    if args.send_measurement:
        token = get_access_token()
        if token:
            send_test_measurement(token, args.send_measurement, args.metric, args.value)
        else:
            print("❌ Falha ao obter token")
            sys.exit(1)
    else:
        main()


if __name__ == "__main__":
    send_measurement_cli()

