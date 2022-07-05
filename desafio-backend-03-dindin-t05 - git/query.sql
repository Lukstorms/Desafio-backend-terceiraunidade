create table usuarios
(
    id serial not null primary key,
    nome text,
    email varchar(80),
    senha text
);

alter table usuarios add constraint emailunico UNIQUE(email);

create table categorias
(
    id serial not null primary key,
    nome text
);

insert into categorias
    (nome)
values
    ('Alimentação'),
    ('Assinaturas e Serviços'),
    ('Casa'),
    ('Mercado'),
    ('Cuidados Pessoais'),
    ('Educação'),
    ('Família'),
    ('Lazer'),
    ('Pets'),
    ('Presentes'),
    ('Roupas'),
    ('Saúde'),
    ('Transporte'),
    ('Salário'),
    ('Vendas'),
    ('Outras receitas'),
    ('Outras despesas');


create table transacoes
(
    id serial,
    descricao text,
    valor int,
    data timestamptz,
    categoria_id int references categorias(id),
    usuario_id int references usuarios(id),
    tipo text
);