# Software de Gestão de Estoque - Projeto Integrador Univesp

## Visão Geral

Este projeto é um **Projeto Integrador** da **Univesp** (Universidade Virtual do Estado de São Paulo), do eixo de **Computação**. Trata-se de um software de gestão de estoque desenvolvido para gerenciar produtos em um armazém ou loja. A aplicação oferece uma interface web intuitiva para controlar o fluxo de itens, desde o cadastro inicial até a consulta de saldos e relatórios. O sistema permite realizar operações de CRUD (Create, Read, Update, Delete) em produtos e fornece ferramentas essenciais para o controle de inventário.

---

## Tecnologias Utilizadas

O projeto foi construído com as seguintes tecnologias:

* **Linguagem de Programação:** Python
* **Framework Web:** Django
* **Banco de Dados:** SQLite
* **Front-end:** HTML, CSS e JavaScript

---

## Funcionalidades Principais

* **Autenticação de Usuários:** Sistema de login e logout para acesso seguro.
* **Gestão de Produtos:**
    * Cadastro de novos produtos com informações detalhadas.
    * Atualização e exclusão de itens existentes.
* **Relatórios:** Geração de relatórios detalhados sobre o estado do estoque.
* **Pesquisa:** Ferramenta de busca para encontrar produtos rapidamente.

---

## Instalação e Execução

Siga os passos abaixo para configurar e executar o projeto em seu ambiente local:

1.  **Clone o Repositório**

    ```
    git clone [https://github.com/gp02pi/pi01.git](https://github.com/gp02pi/pi01.git)
    cd pi01/meu_projeto
    ```

2.  **Crie e Ative um Ambiente Virtual**

    * No Linux/macOS:
        ```
        python3 -m venv venv
        source venv/bin/activate
        ```
    * No Windows:
        ```
        python -m venv venv
        venv\Scripts\activate
        ```

3.  **Instale as Dependências**

    ```
    pip install -r requirements.txt
    ```

4.  **Configure o Banco de Dados**

    Certifique-se de que o MySQL esteja instalado e em execução.
    No arquivo `settings.py`, configure as credenciais do seu banco de dados.

5.  **Aplique as Migrações**

    ```
    python manage.py makemigrations
    python manage.py migrate
    ```

6.  **Crie um Superusuário** (opcional, para acessar o painel de administração)

    ```
    python manage.py createsuperuser
    ```

7.  **Inicie o Servidor**

    ```
    python manage.py runserver
    ```

O projeto estará acessível em `http://127.0.0.1:8000`.