const core = require('@actions/core');
const github = require('@actions/github');
const { Octokit } = require("@octokit/rest");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function trigger_dispatch(octo, owner, repo, event_type) {
    octo.rest.repos.createDispatchEvent({
        owner: owner,
        repo: repo,
        event_type: event_type,
    })
}

async function get_workflow(octo, owner, repo, filename) {
    res = await octo.rest.actions.listWorkflowRuns({
        owner: owner,
        repo: repo,
        workflow_id: filename,
        per_page: 1,
    })
    return res.data.workflow_runs[0].html_url
}

async function getWorkflows(octo, owner, repos, filename) {
    for (let i = 0; i < repos.length; i++) {
        console.log(`Link for ${repos[i]} pipeline:`)
        console.log("> " + await get_workflow(octo, owner, repo[i], filename))
        console.log()
    }
}

async function main() {
    try {
        const backend_repos_raw = core.getInput('backend_repos');
        const frontend_repos_raw = core.getInput('frontend_repos');
        const backend_repos = backend_repos_raw.split('\n')
        const frontend_repos = frontend_repos_raw.split('\n')
        const backend_token = core.getInput('backend_token');
        const frontend_token = core.getInput('frontend_token');
        const backend_owner = core.getInput('backend_owner')
        const frontend_owner = core.getInput('frontend_owner')
        const backend_workflow_filename = core.getInput('backend_workflow_filename')
        const frontend_workflow_filename = core.getInput('frontend_workflow_filename')
        const event_type = core.getInput('event_type');

        const octo_back = new Octokit({
            auth: backend_token
        })

        const octo_front = new Octokit({
            auth: frontend_token
        })

        for (let i = 0; i < backend_repos.length; i++) {
            trigger_dispatch(octo_back, backend_owner, backend_repos[i], event_type)
        }

        for (let i = 0; i < frontend_repos.length; i++) {
            trigger_dispatch(octo_front, frontend_owner, frontend_repos[i], event_type)
        }

        await sleep(3000)

        console.log("LINKS FOR BACKEND PIPELINES:")
        console.log("----------------------------")
        getWorkflows(octo_back, backend_owner, backend_repos, backend_workflow_filename)
        console.log()

        console.log("LINKS FOR FRONTEND PIPELINES:")
        console.log("----------------------------")
        getWorkflows(octo_front, frontend_owner, frontend_repos, frontend_workflow_filename)


    } catch (error) {
        core.setFailed(error.message);
    }
}

main()