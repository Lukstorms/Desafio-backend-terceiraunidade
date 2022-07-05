const conexao = require('../conexao');
const securePassword = require('secure-password');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');


const pwd = securePassword();

const cadastrarUsuario = async (req, res) => {
    const {nome, email, senha} = req.body;
    if (!nome) {
        return res.status(400).json({erro: 'Nome não informado'});
    }
    if (!email) {
        return res.status(400).json({erro: 'Email não informado'});
    }
    if (!senha) {
        return res.status(400).json({erro: 'Senha não informada'});
    }
    try {
        const query = 'SELECT * FROM usuarios WHERE email = $1';
        const usuario = await conexao.query(query, [email]);

        if (usuario.rowCount > 0) {
            return res.status(400).json({"mensagem": "Já existe usuário cadastrado com o e-mail informado."});
        }
    } catch (error) {
        return res.status(400).json(error.message);
    }

    try {
        const hash = (await pwd.hash(Buffer.from(senha))).toString("hex");
        const query = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)';
        const usuario = await conexao.query(query, [nome, email, hash]);        
        if(usuario.rowCount === 0) {
            return res.status(400).json({erro: 'Não foi possível cadastrar o usuário'});            
        }

        const dados = await conexao.query('SELECT nome, email, id FROM usuarios WHERE email = $1', [email]);

        return res.status(201).json(dados.rows[0]);
    } catch (error) {
        return res.status(400).json({"mensagem": 'Não foi possível cadastrar o usuário'});
    }
}

const login = async (req, res) => {
    const {email, senha} = req.body;

    if (!email) {
        return res.status(400).json("O campo email é obrigatório");
    }

    if(!senha) {
        return res.status(400).json("O campo senha é obrigatório");
    }

    try {
        const query = 'SELECT * FROM usuarios WHERE email = $1';
        const usuarios = await conexao.query(query, [email]);

        if(usuarios.rowCount === 0) {
            return res.status(400).json({"mensagem": "Usuário e/ou senha inválido(s)."});
        }

        const usuario = usuarios.rows[0]; 
        
        const token = jwt.sign({
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        }, jwtSecret, {expiresIn: '2h'});

        const retorno = {
            usuario:{
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email},
            token    
        }
        
        return res.status(200).json(retorno);

    } catch (error) {
        return res.status(400).json(error.message);
    }
}

const detalharUsuario = async (req, res) => {
    

    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);

        const usuario = await conexao.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if(usuario.rowCount === 0) {
            return res.status(404).json("Usuário não encontrado");
        }
        const {senha:_, ...dados} = usuario.rows[0];
        return res.status(200).json(dados);
    } catch (error) {
        return res.status(400).json({"mensagem": "Para acessar este recurso um token de autenticação válido deve ser enviado."});
    }
}

const atualizarUsuario = async (req, res) => {
    
    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        const {nome, email, senha} = req.body; 
        const hash = (await pwd.hash(Buffer.from(senha))).toString("hex");

        if(!nome || !email || !senha) {
            return res.status(400).json({"mensagem": "Todos os campos são obrigatórios."});
        }

        const emailExistente = await conexao.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if(emailExistente.rowCount > 0) {
            return res.status(400).json({"mensagem": "Já existe usuário cadastrado com o e-mail informado."});
        }

        const usuario = await conexao.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if(usuario.rowCount === 0) {
            return res.status(404).json("Usuário não encontrado");
        }
        const query = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4';   
        const usuarioAtualizado = await conexao.query(query, [nome, email, hash, id]);
        if(usuarioAtualizado.rowCount === 0) {
            return res.status(400).json("Não foi possível atualizar o usuário");
        }
        return res.status(200).json();
    } catch (error) {
        return res.status(400).json({"mensagem": "O e-mail informado já está sendo utilizado por outro usuário."});
    }
}



module.exports = {
    cadastrarUsuario,
    login,
    detalharUsuario,
    atualizarUsuario
};