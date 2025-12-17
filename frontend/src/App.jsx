import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Layout, Button, Card, Tag, Typography, message, Spin } from 'antd';
import { WalletOutlined, RobotOutlined, ThunderboltFilled } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// 🛑 KEEP YOUR ADDRESS HERE
const MODULE_ADDRESS = "0x7cb960399dc0c06fef8c212d156466b7a25a11c8ac0c254a6801c47e1385afb5"; 
const MODULE_NAME = "marketplace";

function App() {
  const { account, connected, connect, disconnect, signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::purchase_call`,
          functionArguments: [MODULE_ADDRESS],
        },
        // 🛑 ADD THIS BLOCK TO FIX THE GAS ERROR
        options: {
          maxGasAmount: 10000,
          gasUnitPrice: 100,
        }
      };

      const response = await signAndSubmitTransaction(transaction);
      await message.success(`Transaction Success! Hash: ${response.hash.slice(0, 6)}...`);
      console.log("Tx Hash:", response.hash);
      
    } catch (error) {
      console.error("Transaction Error:", error);
      message.error("Transaction Failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}> {/* Deep Black Background */}
      
      {/* HEADER */}
      <Header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#141414', /* Dark Grey Header */
          padding: '0 24px',
          borderBottom: '1px solid #303030'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RobotOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: '#fff' }}>AgentZone</Title>
        </div>
        
        <div>
            {connected ? (
                <Button type="primary" danger onClick={disconnect}>
    {/* The '?' checks if address exists before slicing */}
    Disconnect {account?.address?.toString().slice(0,6)}... 
</Button>
            ) : (
                <Button type="primary" icon={<WalletOutlined />} onClick={() => connect("Petra")}>
                    Connect Petra
                </Button>
            )}
        </div>
      </Header>

      {/* MAIN CONTENT */}
      <Content style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={1} style={{ color: '#fff' }}>Decentralized AI Marketplace</Title>
          <Paragraph style={{ fontSize: '18px', color: '#888' }}>
            Run autonomous AI agents. Pay with crypto. <span style={{color: '#1890ff'}}>Trustless.</span>
          </Paragraph>
        </div>

        {/* AGENT CARD */}
        <Card 
            variant="borderless"
            style={{ 
                width: '100%', 
                background: '#1f1f1f', /* Dark Card */
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                border: '1px solid #303030'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* Left Side: Info */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <Title level={3} style={{ margin: 0, color: '#fff' }}>MyFirstAI Agent</Title>
                        <Tag color="cyan">GPT-4</Tag>
                        <Tag color="purple">Verifiable</Tag>
                    </div>
                    <Paragraph style={{ color: '#aaa', fontSize: '16px' }}>
                        This agent specializes in analyzing Move smart contracts. 
                        It runs off-chain but triggers strictly upon on-chain payment.
                    </Paragraph>
                    <div style={{ display: 'flex', gap: '15px', color: '#666', marginTop: '20px' }}>
                        <span>⚡ Latency: 400ms</span>
                        <span>🛡️ Safety: High</span>
                    </div>
                </div>

                {/* Right Side: Price & Action */}
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <Text style={{ display: 'block', fontSize: '14px', color: '#888' }}>Price per Call</Text>
                    <Title level={2} style={{ margin: '0 0 10px 0', color: '#52c41a' }}>1000 Octas</Title>
                    
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<ThunderboltFilled />}
                        disabled={!connected} 
                        loading={loading}
                        onClick={handlePurchase}
                        style={{ 
                            width: '100%', 
                            height: '50px', 
                            fontSize: '16px',
                            fontWeight: 'bold',
                            background: connected ? '#1890ff' : '#333',
                            borderColor: connected ? '#1890ff' : '#333'
                        }}
                    >
                        {connected ? "Pay & Trigger" : "Connect First"}
                    </Button>
                </div>
            </div>
        </Card>
      </Content>
    </Layout>
  );
}

export default App;