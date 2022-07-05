const conexao = require('../conexao');
const securePassword = require('secure-password');
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

const listarCategorias = async (req, res) => {
    try {        
        const {rows: categorias} = await conexao.query('SELECT * FROM categorias');
        return res.status(200).json(categorias);
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }

}

const listarTransacoes = async (req, res) => {
    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        const usuario = await conexao.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if(usuario.rowCount === 0) {
            return res.status(404).json("Usuário não encontrado");
        }


        const query = `SELECT transacoes.* , categorias.nome FROM transacoes LEFT JOIN categorias ON transacoes.categoria_id = categorias.id WHERE usuario_id = $1`;
        const {rows: transacoes} = await conexao.query(query, [id]);

        const saidaTransacao = transacoes.map(transacao => {
            return {
                id: transacao.id,
                tipo: transacao.tipo,
                descricao: transacao.descricao,
                valor: transacao.valor,
                data: transacao.data,
                usuario_id: transacao.usuario_id,
                categoria_id: transacao.categoria_id,
                categoria_nome: transacao.nome
            }
        });
        

        return res.status(200).json(saidaTransacao);    

    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const detalharTransacao = async (req, res) => {
    try {
        const {id} = req.params;
        const query = 'SELECT * FROM transacoes WHERE id = $1';
        const {rows : transacao} = await conexao.query(query, [id]);
        if(transacao.rowCount === 0) {
            return res.status(404).json({"mensagem": "Transação não encontrada."});
        }
        return res.status(200).json(transacao.rows[0]);
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const cadastrarTransacao = async (req, res) => {
    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        const {descricao, valor, data, categoria_id, tipo} = req.body;     
               
        
        const query = 'INSERT INTO transacoes (descricao, valor, data, categoria_id,usuario_id ,tipo) VALUES ($1, $2, $3, $4, $5, $6)';
        const cadastrada = await conexao.query(query, [descricao, valor, data, categoria_id, id, tipo]);
        if(cadastrada.rowCount === 0) {
            return res.status(400).json({"mensagem": "Todos os campos obrigatórios devem ser informados."});
        }
        
        const descricaoCategoria = await conexao.query('SELECT nome FROM categorias WHERE id = $1', [categoria_id]);
        
        const saidaTransacao = {
            id,
            tipo,
            descricao,
            valor,
            data,
            categoria_id,
            categoria_nome: descricaoCategoria.rows[0].nome                       
        }
        
        return res.status(200).json(saidaTransacao);
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const atualizarTransacao = async (req, res) => {
    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        const identificadorTransacao = req.params.id;
        const {descricao, valor, data, categoria_id, tipo} = req.body;

        const verificação = await conexao.query('SELECT * FROM transacoes WHERE id = $1', [id]);
        if(verificação.rowCount === 0) {
            return res.status(404).json("Transação não encontrada");
        }

        const categoriaExiste = await conexao.query('SELECT id FROM categorias WHERE id = $1', [categoria_id]);
        if(categoriaExiste.rowCount === 0) {
            return res.status(404).json("Categoria não encontrada");
        }
                
        const tipoValido = ['entrada', 'saida'];
        if(!tipoValido.includes(tipo)) {
            return res.status(400).json("Tipo inválido");
        }

        const query = 'UPDATE transacoes SET descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 WHERE id = $6';
        const atualizada = await conexao.query(query, [descricao, valor, data, categoria_id, tipo, identificadorTransacao]);
        
        if(atualizada.rowCount === 0) {
            return res.status(400).json("Transação não atualizada");
        }

        return res.status(200).json();
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const deletarTransacao = async (req, res) => {
    try {
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
        const identificadorTransacao = req.params.id;

        const transacaoExistente = await conexao.query('SELECT * FROM transacoes WHERE id = $1', [identificadorTransacao]);
        if(transacaoExistente.rowCount === 0) {
            return res.status(404).json("Transação não encontrada");
        }

        const query = 'DELETE FROM transacoes WHERE id = $1';
        const deletada = await conexao.query(query, [identificadorTransacao]);
        if(deletada.rowCount === 0) {
            return res.status(400).json("Transação não deletada");
        }
        return res.status(200).json();
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const extrato = async (req, res) => {
    try {        
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);

        

        let somaEntradas = await conexao.query('SELECT SUM(valor) FROM transacoes WHERE tipo = $1 AND usuario_id = $2', ['entrada', id]);
        let somaSaidas = await conexao.query('SELECT SUM(valor) FROM transacoes WHERE tipo = $1 AND usuario_id = $2', ['saida', id]);
        let existeEntrada = await conexao.query('SELECT * FROM transacoes WHERE usuario_id = $1 AND tipo = $2', [id, 'entrada']);
        if(existeEntrada.rowCount === 0) {
            somaEntradas.rows[0].sum = 0;
        }
        let existeSaida = await conexao.query('SELECT * FROM transacoes WHERE usuario_id = $1 AND tipo = $2', [id, 'saida']);
        if(existeSaida.rowCount === 0) {
            somaSaidas.rows[0].sum = 0;
        }
        
        const total = {
            entrada: Number(somaEntradas.rows[0].sum),
            saida: Number(somaSaidas.rows[0].sum)
        }
        
        return res.status(200).json(total);
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

const filtrarCategoria = async (req, res) => {
    try {
        
        const {authorization} = req.headers;
        const token = authorization.replace('Bearer ', '').trim();
        const {id} = jwt.verify(token, jwtSecret);
                
        const {categoria} = req.query;
        
        
        
        
        const query = `SELECT categorias.*,
         transacoes.descricao, transacoes.valor, transacoes.data, transacoes.categoria_id, transacoes.usuario_id,
            transacoes.tipo
         FROM categorias LEFT JOIN transacoes ON categorias.id = transacoes.categoria_id
         WHERE categorias.id = $1`;


        const filtradas = await conexao.query(query, [categoria]);
        
        if(filtradas.rowCount === 0) {
            return res.status(404).json("Nenhuma transação da categoria encontrada");
        }       
        
        const saida = filtradas.rows.map(i => {
            return {
                id: i.id,
                tipo: i.tipo,
                descricao: i.descricao,
                valor: i.valor,
                data: i.data,
                usuario_id: i.usuario_id,
                categoria_id: i.categoria_id,
                categoria_nome: i.nome
            }
        });

        return res.status(200).json(saida);
    } catch (error) {
        return res.status(400).json({erro: error.message});
    }
}

module.exports = {
    listarCategorias,
    listarTransacoes,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    deletarTransacao,
    extrato,
    filtrarCategoria
};