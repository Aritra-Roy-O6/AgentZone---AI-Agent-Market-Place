import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Layout, Button, Card, Tag, Typography, message, Modal, Form, Input, InputNumber, Slider, Menu } from 'antd';
import { 
  WalletOutlined, 
  RobotOutlined, 
  ThunderboltFilled, 
  PlusOutlined, 
  UserOutlined, 
  HomeOutlined, 
  AppstoreOutlined, 
  SafetyCertificateOutlined,
  RocketOutlined 
} from '@ant-design/icons';

// Firebase Imports
import { auth, provider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, getCountFromServer } from 'firebase/firestore';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

// 🛑 UPDATED MODULE ADDRESS (MVP_V3)
const MODULE_ADDRESS = "0x5b9524cb4e46119481ddd76792db383e6a736c7d706fee5ddff44b80e7f2b889"; 
const MODULE_NAME = "marketplace";

function App() {
  const { account, connected, connect, disconnect, signAndSubmitTransaction } = useWallet();
  
  // --- STATE ---
  const [view, setView] = useState('home'); // 'home' | 'agents'
  const [user, setUser] = useState(null);
  const [agents, setAgents] = useState([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  
  // Marketplace Actions
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [purchaseDays, setPurchaseDays] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Access Control
  const [purchasedAgents, setPurchasedAgents] = useState({});
  const [activeAgent, setActiveAgent] = useState(null);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Fetch Agents from Firestore
    const fetchAgents = async () => {
      const querySnapshot = await getDocs(collection(db, "agents"));
      const agentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAgents(agentsList);
    };

    // Load Purchases from LocalStorage
    const stored = JSON.parse(localStorage.getItem('my_purchased_agents') || '{}');
    setPurchasedAgents(stored);

    fetchAgents();
    return () => unsubscribe();
  }, []);

  // --- 2. AUTHENTICATION ---
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      message.success("Logged in!");
    } catch (e) {
      message.error("Login failed");
    }
  };

  // --- 3. UPLOAD LOGIC (MULTI-AGENT SUPPORT) ---
  const handleUpload = async (values) => {
    if (!account) {
      message.error("Connect Aptos Wallet to register agent on-chain!");
      return;
    }
    setLoading(true);
    try {
      // 🛑 FIX 1: Convert account.address to string for the query
      // "where" fails if you pass the raw object
      const q = query(
        collection(db, "agents"), 
        where("creator_addr", "==", account.address.toString()) 
      );
      
      const snapshot = await getCountFromServer(q);
      const agentIndex = snapshot.data().count;

      const transaction = {
        data: {
            function: `${MODULE_ADDRESS}::${MODULE_NAME}::register_agent`,
            functionArguments: [values.price, values.hf_link], 
        }
      };
      await signAndSubmitTransaction(transaction);

      // 🛑 FIX 2: Store it as a string in the database too
      await addDoc(collection(db, "agents"), {
        name: values.name,
        description: values.description,
        hf_link: values.hf_link,
        linkedin: values.linkedin,
        price: values.price,
        creator_addr: account.address.toString(), // <--- Add .toString() here
        agent_index: agentIndex,
        verified: true
      });

      message.success("Agent Listed Successfully!");
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      message.error("Failed to list agent. Ensure wallet is connected.");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. PURCHASE LOGIC ---
  const initiateBuy = (agent) => {
    setSelectedAgent(agent);
    setPurchaseDays(1); // Reset default
    setIsBuyModalOpen(true);
  };

  const handlePurchase = async () => {
    if (!account || !selectedAgent) return;
    setLoading(true);
    try {
      // Default to 0 if legacy agent (backward compatibility)
      const agentId = selectedAgent.agent_index !== undefined ? selectedAgent.agent_index : 0;

      const transaction = {
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::purchase_call`,
          // Arguments: [Creator Address, Agent Index, Number of Days]
          functionArguments: [selectedAgent.creator_addr, agentId, purchaseDays], 
        },
      };

      const response = await signAndSubmitTransaction(transaction);
      
      // Update Local Storage using Firestore ID (Unique per listing)
      const newPurchases = { ...purchasedAgents, [selectedAgent.id]: true };
      localStorage.setItem('my_purchased_agents', JSON.stringify(newPurchases));
      setPurchasedAgents(newPurchases);

      message.success(`Bought for ${purchaseDays} days!`);
      setIsBuyModalOpen(false);
    } catch (error) {
      console.error(error);
      message.error("Transaction Failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- 5. RENDER COMPONENTS ---

  // Navigation Menu Items
  const menuItems = [
    { key: 'home', icon: <HomeOutlined />, label: 'Home' },
    { key: 'agents', icon: <AppstoreOutlined />, label: 'Marketplace' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      
      {/* HEADER */}
      <Header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#141414', 
          padding: '0 24px',
          borderBottom: '1px solid #303030',
          position: 'sticky',
          top: 0,
          zIndex: 1000
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RobotOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: '#fff', display: 'none', md: 'block' }}>AgentZone</Title>
        </div>

        {/* Navigation Tabs */}
        <Menu 
            theme="dark" 
            mode="horizontal" 
            selectedKeys={[view]} 
            items={menuItems}
            onClick={(e) => { setView(e.key); setActiveAgent(null); }}
            style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: 'none' }}
        />
        
        {/* Actions (Login / Wallet / Upload) */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {user && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                Upload
              </Button>
            )}

            {user ? (
                <Button icon={<UserOutlined />} onClick={() => signOut(auth)}>Logout</Button>
            ) : (
                <Button type="primary" onClick={handleLogin}>Login</Button>
            )}

            {connected ? (
                <Button type="primary" danger onClick={disconnect}>
                    {account?.address?.toString().slice(0,6)}...
                </Button>
            ) : (
                <Button type="primary" icon={<WalletOutlined />} onClick={() => connect("Petra")}>
                    Connect
                </Button>
            )}
        </div>
      </Header>

      {/* CONTENT AREA */}
      <Content style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* VIEW 1: HOME PAGE */}
        {view === 'home' && (
            <div style={{ color: '#fff', textAlign: 'center', padding: '40px 0' }}>
                <Title style={{ color: '#fff', fontSize: '3rem' }}>The Future of AI is <span style={{color: '#1890ff'}}>Decentralized</span></Title>
                <Paragraph style={{ fontSize: '1.2rem', color: '#888', maxWidth: '800px', margin: '0 auto 60px' }}>
                    AgentZone is the first marketplace where you can rent autonomous AI agents using crypto. 
                    Developers monetize their code; users get trustless access.
                </Paragraph>
                
                <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => setView('agents')} style={{ marginBottom: '80px', padding: '0 40px', height: '50px', fontSize: '18px' }}>
                    Explore Agents
                </Button>

                {/* Features Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', textAlign: 'left' }}>
                    <Card style={{ background: '#1f1f1f', borderColor: '#333' }}>
                        <Title level={3} style={{ color: '#fff' }}><SafetyCertificateOutlined /> Secure & Trustless</Title>
                        <Paragraph style={{ color: '#aaa' }}>
                            Payments are handled by Aptos Smart Contracts. Money flows directly from user to creator. No middlemen.
                        </Paragraph>
                    </Card>

                    <Card style={{ background: '#1f1f1f', borderColor: '#333' }}>
                        <Title level={3} style={{ color: '#fff' }}><ThunderboltFilled /> Powered by Aptos</Title>
                        <Paragraph style={{ color: '#aaa' }}>
                            Leveraging the speed and low gas fees of the Aptos Move language for sub-second transactions.
                        </Paragraph>
                    </Card>
                    
                    <Card style={{ background: '#1f1f1f', borderColor: '#333' }}>
                        <Title level={3} style={{ color: '#fff' }}><RobotOutlined /> AI Monetization</Title>
                        <Paragraph style={{ color: '#aaa' }}>
                            Upload your HuggingFace Spaces and start earning crypto immediately. We handle the access control.
                        </Paragraph>
                    </Card>
                </div>
            </div>
        )}

        {/* VIEW 2: MARKETPLACE / AGENT USAGE */}
        {view === 'agents' && (
            <>
                {activeAgent ? (
                    // --- SUB-VIEW: ACTIVE AGENT INTERFACE ---
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <Button onClick={() => setActiveAgent(null)} style={{ marginBottom: '20px' }}>
                            ← Back to Marketplace
                        </Button>
                        <div style={{ height: '80vh', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                            <iframe 
                                src={activeAgent.hf_link} 
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="Agent Interface"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        </div>
                    </div>
                ) : (
                    // --- SUB-VIEW: AGENT GRID ---
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
                        {agents.map((agent) => (
                            <Card 
                                key={agent.id}
                                hoverable
                                variant="borderless"
                                style={{ background: '#1f1f1f', borderColor: '#303030', color: '#fff' }}
                                actions={[
                                    purchasedAgents[agent.id] ? (
                                        <Button type="primary" block onClick={() => setActiveAgent(agent)}>
                                            Launch Agent 🚀
                                        </Button>
                                    ) : (
                                        <Button type="primary" ghost block onClick={() => initiateBuy(agent)}>
                                            Rent for {agent.price} APT/day
                                        </Button>
                                    )
                                ]}
                            >
                                <Card.Meta 
                                    avatar={<RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />}
                                    title={<span style={{ color: '#fff', fontSize: '18px' }}>{agent.name}</span>}
                                    description={
                                        <div style={{ color: '#aaa', marginTop: '10px' }}>
                                            <p style={{ minHeight: '45px' }}>{agent.description}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Tag color="cyan">Verifiable</Tag>
                                                <a href={`https://linkedin.com/in/${agent.linkedin}`} target="_blank" rel="noreferrer" style={{color: '#1890ff', fontSize: '12px'}}>
                                                    By: {agent.linkedin}
                                                </a>
                                            </div>
                                        </div>
                                    }
                                />
                            </Card>
                        ))}
                        {agents.length === 0 && (
                            <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#666', marginTop: '50px' }}>
                                <Title level={4} style={{ color: '#444' }}>No Agents Listed Yet</Title>
                                <p>Be the first to upload an AI Agent!</p>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}

        {/* --- MODALS --- */}

        {/* UPLOAD MODAL */}
        <Modal title="Upload New Agent" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
            <Form onFinish={handleUpload} layout="vertical">
                <Form.Item name="name" label="Agent Name" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
                <Form.Item name="hf_link" label="HuggingFace Space URL" rules={[{ required: true, type: 'url' }]} placeholder="https://huggingface.co/spaces/..." ><Input /></Form.Item>
                <Form.Item name="linkedin" label="LinkedIn ID" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="price" label="Price per Day (Octas)" rules={[{ required: true }]}><InputNumber style={{width: '100%'}} min={100} /></Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>Submit & Register On-Chain</Button>
            </Form>
        </Modal>

        {/* BUY MODAL */}
        <Modal title="Purchase Access" open={isBuyModalOpen} onCancel={() => setIsBuyModalOpen(false)} footer={null}>
            {selectedAgent && (
                <div style={{ textAlign: 'center' }}>
                    <Title level={4}>{selectedAgent.name}</Title>
                    <Paragraph>Select duration to rent this agent.</Paragraph>
                    
                    <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                        <Slider min={1} max={30} value={purchaseDays} onChange={setPurchaseDays} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                            <Text strong>{purchaseDays} Days</Text>
                            <Text type="success" strong>{selectedAgent.price * purchaseDays} Octas</Text>
                        </div>
                    </div>
                    
                    <Button type="primary" loading={loading} onClick={handlePurchase} block size="large" icon={<ThunderboltFilled />}>
                        Confirm Payment
                    </Button>
                </div>
            )}
        </Modal>

      </Content>
      
      {/* FOOTER */}
      <Footer style={{ textAlign: 'center', background: '#0a0a0a', color: '#444', borderTop: '1px solid #222' }}>
        AgentZone ©2025 | Built on Aptos Move
      </Footer>
    </Layout>
  );
}

export default App;