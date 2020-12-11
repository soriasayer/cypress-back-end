/// <reference types="cypress" />


describe("Test with backend", () => {
  beforeEach("login to the app", () => {
    cy.server();
    cy.route("GET", "**/tags", "fixture:tags.json");
    cy.loginToApplication();
  });

  it("Verify correct request and response", () => {
    cy.server();
    cy.route("POST", "**/articles").as("postArticles");

    cy.contains(" New Article ").click();
    cy.get('[formcontrolname="title"]').type("This is a title");
    cy.get('[formcontrolname="description"]').type("This is a description");
    cy.get('[formcontrolname="body"]').type(
      "Angular is running in the development mode"
    );
    cy.contains(" Publish Article ").click();

    cy.wait("@postArticles");
    cy.get("@postArticles").then((xhr) => {
      console.log(xhr);
      expect(xhr.status).to.equal(200);
      expect(xhr.request.body.article.body).to.equal(
        "Angular is running in the development mode"
      );
      expect(xhr.response.body.article.description).to.equal(
        "This is a description"
      );
    });
  });

  it("Should gave tags with routing object", () => {
    cy.get(".tag-list")
      .should("contain", "cypress")
      .and("contain", "automation")
      .and("contain", "testing");
  });

  it("verify global feed likes count", () => {
    cy.server();
    cy.route("GET", "**/articles/feed*", '{"articles":[],"articlesCount":0}');
    cy.route("GET", "**/articles*", "fixture:articles.json");

    cy.contains(" Global Feed ").click();

    cy.get("app-article-list button").then((listOfbuttons) => {
      expect(listOfbuttons[0]).to.contain(3);
      expect(listOfbuttons[1]).to.contain(5);
    });

    cy.fixture('articles').then(file => {
      const articleLink = file.articles[0].slug
      cy.route('POST', '**/articles/'+articleLink+'/favorite', file)
    })

    cy.get('app-article-list button')
    .eq(0)
    .click()
    .should('contain', 4)
  });

  it('Delete a new article in a global feed', () => {

    const bodyRequest = {
        "article": {
            "tagList": [],
            "title": "Request form API",
            "description": "API testing is not easy",
            "body": "I love react."
        }
    }

    cy.get('@token').then(token => {

      cy.request({
        url: 'https://conduit.productionready.io/api/articles/',
        headers: { 'Authorization': 'Token '+token},
        method: 'POST',
        body: bodyRequest
      }).then(response => {
        expect(response.status).to.equal(200)
      })

      cy.contains('Global Feed').click()
      cy.get('.article-preview').first().click()
      cy.get('.article-actions').contains('Delete Article').click({force: true})

      cy.request({
        url: 'https://conduit.productionready.io/api/articles?limit=10&offset=0',
        headers: { 'Authorization': 'Token '+token},
        method: 'GET'
      }).its('body').then(body => {
        expect(body.articles[0].title).not.to.equal(bodyRequest.article.title)
      })

    })
  })
});
